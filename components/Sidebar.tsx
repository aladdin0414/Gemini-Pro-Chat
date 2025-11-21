import React, { useState, useMemo } from 'react';
import { Session, Theme, Language } from '../types';
import { Translation } from '../utils/translations';
import { MessageSquarePlus, Search, MessageSquare, Trash2, X, Settings, Moon, Sun, Monitor, Globe } from 'lucide-react';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  isOpen,
  setIsOpen,
  theme,
  setTheme,
  language,
  setLanguage,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    return sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sessions, searchQuery]);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 flex flex-col transition-transform duration-300 ease-in-out
        bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header & New Chat */}
        <div className="p-4 flex flex-col gap-4">
          <button 
            onClick={() => {
              onCreateSession();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="flex items-center justify-start gap-3 w-full px-4 py-3 rounded-lg transition-colors border shadow-sm
              bg-white dark:bg-gray-800 
              border-gray-200 dark:border-gray-700 
              hover:bg-gray-100 dark:hover:bg-gray-700 
              text-gray-900 dark:text-white"
          >
            <MessageSquarePlus size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium">{t.newChat}</span>
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500
                bg-white dark:bg-gray-950 
                text-gray-900 dark:text-gray-200 
                border border-gray-200 dark:border-gray-800"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {filteredSessions.length === 0 ? (
             <div className="text-center text-gray-500 mt-10 text-sm">{t.noChats}</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors
                  ${activeSessionId === session.id 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}
                `}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
              >
                <MessageSquare size={18} className="shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="truncate text-sm font-medium">{session.title}</div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-500 opacity-80">{session.preview}</div>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className={`
                    absolute right-2 p-1.5 rounded-md transition-opacity
                    text-gray-400 hover:text-red-500 hover:bg-gray-300 dark:hover:bg-gray-700
                    ${activeSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}
                  title={t.deleteChat}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User / Footer area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
           >
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
               U
             </div>
             <div className="flex flex-col items-start text-sm">
               <span className="text-gray-900 dark:text-gray-200 font-medium">{t.user}</span>
               <span className="text-gray-500 dark:text-gray-400 text-xs">{t.settings}</span>
             </div>
             <Settings size={16} className="ml-auto text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
           </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">{t.settings}</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Theme Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t.theme}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', icon: Sun, label: t.light },
                    { value: 'dark', icon: Moon, label: t.dark },
                    { value: 'system', icon: Monitor, label: t.auto },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isSelected = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as Theme)}
                        className={`
                          flex flex-col items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}
                        `}
                      >
                        <Icon size={20} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t.language}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'en', label: 'English' },
                    { value: 'zh', label: '中文' },
                  ].map((option) => {
                    const isSelected = language === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setLanguage(option.value as Language)}
                        className={`
                          flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}
                        `}
                      >
                        <Globe size={18} className={isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-400"} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs text-gray-500 text-center">
                  {t.version}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;