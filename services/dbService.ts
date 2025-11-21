import { Session, Message, Role } from "../types";
import { v4 as uuidv4 } from 'uuid';

// In a real Node.js app, these would be SQL queries.
// We use LocalStorage here to make the demo functional without a running backend server.

const STORAGE_KEYS = {
  SESSIONS: 'gemini_chat_sessions',
  MESSAGES: 'gemini_chat_messages',
};

// --- Session Methods ---

export const getSessions = (): Session[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!stored) return [];
  return JSON.parse(stored).sort((a: Session, b: Session) => b.updatedAt - a.updatedAt);
};

export const createSession = (title: string = "New Chat"): Session => {
  const sessions = getSessions();
  const newSession: Session = {
    id: uuidv4(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    preview: "Start a new conversation",
  };
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([newSession, ...sessions]));
  return newSession;
};

export const updateSession = (id: string, updates: Partial<Session>) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }
};

export const deleteSession = (id: string) => {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));

  // Cascade delete messages
  const allMessages = getAllMessagesRaw();
  const filteredMessages = allMessages.filter(m => m.sessionId !== id);
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(filteredMessages));
};

export const searchSessions = (query: string): Session[] => {
  const sessions = getSessions();
  if (!query) return sessions;
  const lowerQuery = query.toLowerCase();
  return sessions.filter(s => s.title.toLowerCase().includes(lowerQuery));
};

// --- Message Methods ---

const getAllMessagesRaw = (): Message[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  return stored ? JSON.parse(stored) : [];
};

export const getMessagesBySession = (sessionId: string): Message[] => {
  const all = getAllMessagesRaw();
  return all.filter(m => m.sessionId === sessionId).sort((a, b) => a.timestamp - b.timestamp);
};

export const saveMessage = (sessionId: string, role: Role, content: string): Message => {
  const all = getAllMessagesRaw();
  const newMessage: Message = {
    id: uuidv4(),
    sessionId,
    role,
    content,
    timestamp: Date.now()
  };
  
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([...all, newMessage]));

  // Update session preview and timestamp
  updateSession(sessionId, {
    preview: content.substring(0, 60) + (content.length > 60 ? '...' : ''),
  });

  return newMessage;
};
