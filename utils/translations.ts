import { Language } from '../types';

export const translations = {
  en: {
    newChat: "New Chat",
    searchPlaceholder: "Search chats...",
    noChats: "No chats found",
    settings: "Settings",
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    you: "You",
    deleteChat: "Delete chat",
    copy: "Copy",
    copied: "Copied",
    error: "Failed to send message. Please try again.",
    welcomeTitle: "How can I help you today?",
    welcomeSubtitle: "Powered by Gemini 2.5 Flash. Ask me anything, generate code, or translate text.",
    inputPlaceholder: "Message Gemini...",
    disclaimer: "Gemini can make mistakes. Consider checking important information.",
    user: "User",
    close: "Close",
    version: "Gemini Pro Chat v1.2.0",
  },
  zh: {
    newChat: "新对话",
    searchPlaceholder: "搜索对话...",
    noChats: "未找到对话",
    settings: "设置",
    theme: "主题",
    language: "语言",
    light: "浅色",
    dark: "深色",
    auto: "自动",
    you: "你",
    deleteChat: "删除对话",
    copy: "复制",
    copied: "已复制",
    error: "发送失败，请重试。",
    welcomeTitle: "今天有什么可以帮您？",
    welcomeSubtitle: "由 Gemini 2.5 Flash 驱动。问我任何问题，生成代码或翻译文本。",
    inputPlaceholder: "给 Gemini 发送消息...",
    disclaimer: "Gemini 可能会犯错。请核实重要信息。",
    user: "用户",
    close: "关闭",
    version: "Gemini Pro Chat v1.2.0",
  }
};

export type Translation = typeof translations.en;

export const getTranslations = (lang: Language): Translation => {
  return translations[lang];
};