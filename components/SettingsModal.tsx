import React from 'react';
import { UserSettings, Theme, Language, SendKey, FontSize } from '../types';
import { Translation } from '../utils/translations';
import { X, Moon, Sun, Monitor, Type, Keyboard, Terminal } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  t: Translation;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings, 
  t 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.settings}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Section: General */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Monitor size={14} /> {t.general}
            </h3>
            
            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.theme}</span>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {(['light', 'dark', 'system'] as Theme[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => onUpdateSettings({ theme: m })}
                      className={`p-2 rounded-md transition-all ${
                        settings.theme === m 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-200 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      title={m}
                    >
                      {m === 'light' && <Sun size={16} />}
                      {m === 'dark' && <Moon size={16} />}
                      {m === 'system' && <Monitor size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.language}</span>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {(['en', 'zh'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => onUpdateSettings({ language: l })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        settings.language === l 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-200 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {l === 'en' ? 'English' : '中文'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Section: Chat Preferences */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Keyboard size={14} /> {t.chatSettings}
            </h3>

            <div className="space-y-4">
              {/* Send Key */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.sendKey}</span>
                <select 
                  value={settings.sendKey}
                  onChange={(e) => onUpdateSettings({ sendKey: e.target.value as SendKey })}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Enter">{t.enterToSend}</option>
                  <option value="Ctrl+Enter">{t.ctrlEnterToSend}</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Type size={16} /> {t.fontSize}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdateSettings({ fontSize: size })}
                      className={`py-2 px-3 text-sm border rounded-lg transition-all ${
                        settings.fontSize === size
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t[size]}
                    </button>
                  ))}
                </div>
              </div>

              {/* System Instruction */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Terminal size={16} /> {t.systemInstruction}
                </span>
                <textarea
                  value={settings.systemInstruction}
                  onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
                  placeholder={t.systemInstructionPlaceholder}
                  rows={3}
                  className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500">
                  {settings.language === 'zh' ? '该指令将应用于所有新发送的消息。' : 'Instructions will apply to new messages sent.'}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;