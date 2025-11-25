
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MessageItem from './components/MessageItem';
import { getSessions, createSession, getMessagesBySession, saveMessage, deleteSession, updateSession } from './services/dbService';
import { streamChatResponse, generateTitle } from './services/geminiService';
import { Session, Message, Role, Theme, Language } from './types';
import { getTranslations } from './utils/translations';
import { Send, Menu, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme & Language State
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState<Language>('en');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Translations
  const t = getTranslations(language);

  // Load Settings (Theme & Language)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_preference') as Theme;
    if (savedTheme) setTheme(savedTheme);

    const savedLang = localStorage.getItem('language_preference') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      // Simple browser language detection
      const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
      setLanguage(browserLang);
    }
  }, []);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme_preference', theme);
  }, [theme]);

  // Persist Language
  useEffect(() => {
    localStorage.setItem('language_preference', language);
  }, [language]);

  // Listen for system theme changes if in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      const storedSessions = await getSessions();
      setSessions(storedSessions);
      if (storedSessions.length > 0) {
        setCurrentSessionId(storedSessions[0].id);
      } else {
        handleCreateSession();
      }
    };
    loadData();
  }, []);

  // Load Messages when session changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentSessionId) {
        const sessionMessages = await getMessagesBySession(currentSessionId);
        setMessages(sessionMessages);
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [currentSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleCreateSession = async () => {
    const newSession = await createSession(); 
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string) => {
    // Optimistic update
    const prevSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== id));
    
    await deleteSession(id);
    
    if (currentSessionId === id) {
      const remaining = prevSessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        handleCreateSession();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId || isGenerating) return;

    const textToSend = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 1. Save User Message (Optimistic UI)
    const userMsgId = uuidv4();
    const userMsg: Message = {
      id: userMsgId,
      sessionId: currentSessionId,
      role: Role.User,
      content: textToSend,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Background Save
    saveMessage(currentSessionId, Role.User, textToSend).catch(err => console.error(err));

    setIsGenerating(true);

    // 2. Optimistic UI for Bot Message
    const botMsgId = uuidv4();
    const initialBotMsg: Message = {
      id: botMsgId,
      sessionId: currentSessionId,
      role: Role.Model,
      content: '',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, initialBotMsg]);

    // 3. Generate Title if it's the first message
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && (currentSession.title === 'New Chat' || currentSession.title === '新对话') && messages.length === 0) {
       generateTitle(textToSend, language).then(async (newTitle) => {
         // Optimistic
         setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
         // API Call
         await updateSession(currentSessionId, { title: newTitle });
       });
    }

    try {
      // 4. Call Gemini
      const historyContext = messages; 

      let fullResponse = "";
      await streamChatResponse(historyContext, textToSend, (chunkText) => {
        fullResponse = chunkText;
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, content: fullResponse } : m
        ));
      });

      // 5. Save Bot Message Final State
      await saveMessage(currentSessionId, Role.Model, fullResponse);
      
      // Refresh sessions list order (as backend updates 'updatedAt')
      const updatedSessions = await getSessions();
      setSessions(updatedSessions);

    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, content: t.error, isError: true } : m
      ));
      await saveMessage(currentSessionId, Role.Model, t.error, true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
      
      {/* Sidebar */}
      <Sidebar 
        sessions={sessions}
        activeSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        theme={theme}
        setTheme={setTheme}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-white dark:bg-gray-900">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="mr-4 text-gray-600 dark:text-gray-300">
            <Menu />
          </button>
          <span className="font-semibold">Gemini Chat</span>
        </div>

        {/* Messages List - CENTERED CONTAINER */}
        <div className="flex-1 overflow-y-auto scroll-smooth p-4">
          <div className="max-w-5xl mx-auto flex flex-col pb-32 pt-2">
            {messages.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-6">
                  <Send size={32} className="text-blue-500 ml-1" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-200 mb-2">{t.welcomeTitle}</h2>
                <p className="text-center max-w-md">
                  {t.welcomeSubtitle}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} t={t} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full 
          bg-gradient-to-t from-white via-white to-transparent
          dark:from-gray-900 dark:via-gray-900 dark:to-transparent 
          pb-6 pt-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative flex items-end gap-2 
              bg-white dark:bg-gray-800 shadow-xl 
              border border-gray-200 dark:border-gray-700 
              rounded-xl px-4 py-3 
              transition-all">
               <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.inputPlaceholder}
                className="w-full max-h-[200px] bg-transparent border-0 focus:ring-0 focus:outline-none
                  text-gray-900 dark:text-gray-100 
                  placeholder-gray-500 dark:placeholder-gray-400 
                  resize-none py-2 scrollbar-hide"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isGenerating}
                className={`p-2 rounded-lg mb-0.5 transition-all ${
                  inputValue.trim() && !isGenerating
                    ? 'bg-blue-600 text-white hover:bg-blue-500' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">{t.disclaimer}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
