import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Role, FontSize } from '../types';
import { Translation } from '../utils/translations';
import { User, Bot, Copy, Check } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  t: Translation;
  fontSize: FontSize;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, t, fontSize }) => {
  const isUser = message.role === Role.User;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Font size classes
  const textSizeClass = 
    fontSize === 'small' ? 'prose-sm' : 
    fontSize === 'large' ? 'prose-lg' : 
    'prose-base';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* Inner Container */}
      <div className={`flex max-w-[95%] md:max-w-[90%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className="shrink-0 flex flex-col items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm
            ${isUser ? 'bg-blue-600' : 'bg-green-600 dark:bg-green-700'}
          `}>
             {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
        </div>

        {/* Content Bubble */}
        <div className={`
            relative overflow-hidden p-3.5 md:p-4 shadow-sm
            ${isUser 
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700/50'}
        `}>
          
          {/* Markdown Content */}
          <div className={`
            prose max-w-none leading-relaxed break-words ${textSizeClass}
            ${isUser 
              ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-a:text-blue-100 prose-code:text-white prose-code:bg-blue-700/50 prose-li:text-white prose-li:marker:text-blue-200 prose-blockquote:border-blue-300 prose-blockquote:text-blue-100' 
              : 'text-gray-800 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-li:marker:text-gray-500 dark:prose-li:marker:text-gray-400 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400'}
            prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700 dark:prose-pre:border-gray-800
            prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
          `}>
             <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // Links: Open in new tab
                  a: ({node, ...props}) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className={`hover:underline cursor-pointer ${isUser ? 'text-white underline decoration-blue-300' : ''}`} />
                  ),
                  // Lists: Ensure bullets are visible
                  ul: ({node, ...props}) => (
                    <ul className="list-disc list-outside ml-4" {...props} />
                  ),
                  ol: ({node, ...props}) => (
                    <ol className="list-decimal list-outside ml-4" {...props} />
                  ),
                  // Tables: Custom styling for borders and backgrounds
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-4 rounded-md border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-left text-sm border-collapse" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => (
                    <thead className={isUser ? "bg-blue-700" : "bg-gray-100 dark:bg-gray-900/50"} {...props} />
                  ),
                  th: ({node, ...props}) => (
                    <th className={`p-2 border-b font-semibold whitespace-nowrap ${isUser ? 'border-blue-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`} {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className={`p-2 border-b last:border-0 ${isUser ? 'border-blue-500/30 text-white' : 'border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`} {...props} />
                  ),
                  // Code Blocks
                  code({node, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeText = String(children).replace(/\n$/, '');
                    
                    return match ? (
                      <div className="rounded-md bg-gray-900 dark:bg-gray-950 border border-gray-700 dark:border-gray-800 my-4 overflow-hidden shadow-sm text-left">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 dark:bg-gray-900/50 border-b border-gray-700 dark:border-gray-800">
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
                      <code className={`px-1 py-0.5 rounded font-medium text-[0.9em] ${isUser ? 'bg-blue-500/30 text-white border border-blue-400/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-orange-300'}`} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
             >
               {message.content}
             </ReactMarkdown>
             
             {message.isError && (
               <div className={`mt-2 text-sm p-2 rounded border ${isUser ? 'bg-red-500/20 border-red-400 text-white' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20'}`}>
                 {t.error}
               </div>
             )}
          </div>

          {/* Footer Actions (Copy button for AI) */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
              <button 
                onClick={() => handleCopy(message.content)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                title={t.copy}
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span className="text-xs">{copied ? t.copied : t.copy}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;