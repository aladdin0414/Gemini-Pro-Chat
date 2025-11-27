import React, { useState, useEffect } from 'react';
import { Session } from '../types';
import { Translation } from '../utils/translations';
import { searchSessions } from '../services/dbService';
import { MessageSquarePlus, Search, Trash2, Settings, Loader2 } from 'lucide-react';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void; // Trigger for modal
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  t: Translation;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onOpenSettings,
  isOpen,
  setIsOpen,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Session[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchSessions(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Determine which list to show
  const displaySessions = searchResults !== null ? searchResults : sessions;

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
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
               {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </div>
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
          {displaySessions.length === 0 ? (
             <div className="text-center text-gray-500 mt-10 text-sm">{t.noChats}</div>
          ) : (
            displaySessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors
                  ${activeSessionId === session.id 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}
                `}
              >
                <div className="flex-1 overflow-hidden">
                   <div className="truncate font-medium text-sm">{session.title}</div>
                   <div className="truncate text-xs text-gray-500 dark:text-gray-500 opacity-80">{session.preview || t.newChat}</div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t.deleteChat + '?')) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className={`
                    p-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-red-500 transition-opacity
                    ${activeSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}
                  title={t.deleteChat}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer / Settings */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <button 
              onClick={onOpenSettings}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors w-full px-2 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              <Settings size={18} />
              <span>{t.settings}</span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default Sidebar;