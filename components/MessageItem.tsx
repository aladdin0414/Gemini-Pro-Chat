import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Role } from '../types';
import { Translation } from '../utils/translations';
import { User, Bot, Copy, Check } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  t: Translation;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, t }) => {
  const isUser = message.role === Role.User;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`
      group w-full border-b border-black/5 dark:border-white/5
      ${isUser ? 'bg-white dark:bg-transparent' : 'bg-gray-50 dark:bg-gray-800/30'}
    `}>
      <div className="max-w-3xl mx-auto p-4 md:p-6 flex gap-4 md:gap-6">
        
        {/* Avatar */}
        <div className="shrink-0 flex flex-col relative items-end">
          <div className={`
            w-8 h-8 rounded-sm flex items-center justify-center text-white
            ${isUser ? 'bg-gray-500 dark:bg-gray-600' : 'bg-green-600 dark:bg-green-700'}
          `}>
             {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          <div className="font-bold text-sm mb-1 opacity-90 text-gray-900 dark:text-gray-100">
            {isUser ? t.you : 'Gemini'}
          </div>
          
          {/* Message Body - Markdown Rendering */}
          <div className="prose prose-sm max-w-none leading-7 
            text-gray-800 dark:text-gray-200 
            prose-headings:text-gray-900 dark:prose-headings:text-gray-100
            prose-strong:text-gray-900 dark:prose-strong:text-gray-100
            prose-a:text-blue-600 dark:prose-a:text-blue-400
            prose-code:text-gray-800 dark:prose-code:text-gray-200
            prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700 dark:prose-pre:border-gray-800
          ">
             <ReactMarkdown
                components={{
                  code({node, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeText = String(children).replace(/\n$/, '');
                    
                    return match ? (
                      <div className="rounded-md bg-gray-900 dark:bg-gray-950 border border-gray-700 dark:border-gray-800 my-4 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-800">
                          <span className="text-xs text-gray-400 font-medium">{match[1]}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(codeText);
                            }}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Copy size={12} />
                            {t.copy}
                          </button>
                        </div>
                        <div className="!m-0 !p-0 overflow-x-auto">
                          <SyntaxHighlighter
                            {...props as any}
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            codeTagProps={{
                              style: { backgroundColor: 'transparent' }
                            }}
                            customStyle={{
                              margin: 0,
                              padding: '1rem',
                              background: 'transparent',
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                            }}
                          >
                            {codeText}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <code className="bg-gray-200 dark:bg-gray-800 rounded px-1 py-0.5 text-gray-800 dark:text-orange-300 font-medium" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
             >
               {message.content}
             </ReactMarkdown>
             {message.isError && (
               <div className="mt-2 text-red-600 dark:text-red-400 text-sm p-2 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded">
                 {t.error}
               </div>
             )}
          </div>

          {/* Message Copy Action */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleCopy(message.content)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                title={t.copy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied && <span className="text-xs">{t.copied}</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;