/**
 * ⚠️ IMPORTANT: This is a CLIENT-SIDE file meant to run in the Browser.
 * DO NOT run this file with 'node'. It interacts with the backend API and LocalStorage.
 * 
 * Correct Usage: Import this file in your React components (e.g., App.tsx).
 */

import { Session, Message, Role } from "../types";
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper for API calls with LocalStorage fallback
async function apiRequest<T>(
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>,
  description: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Silent fail for dev UX, but you can log it
    // console.warn(`${description} failed (Backend likely offline). Falling back to local storage.`);
    return fallback();
  }
}

// --- Local Storage Implementation Helpers ---
const ls = {
  getSessions: (): Session[] => {
    if (typeof localStorage === 'undefined') return []; // Safety for SSR/Node checks
    const data = localStorage.getItem('sessions');
    return data ? JSON.parse(data) : [];
  },
  saveSessions: (sessions: Session[]) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('sessions', JSON.stringify(sessions));
  },
  getMessages: (sessionId: string): Message[] => {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(`messages_${sessionId}`);
    return data ? JSON.parse(data) : [];
  },
  saveMessages: (sessionId: string, messages: Message[]) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messages));
  }
};

// --- Session Methods ---

export const getSessions = async (): Promise<Session[]> => {
  return apiRequest(
    async () => {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    () => ls.getSessions(),
    "Fetch sessions"
  );
};

export const createSession = async (title: string = "New Chat"): Promise<Session> => {
  const newSession: Session = {
    id: uuidv4(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    preview: "Start a new conversation",
  };
  
  return apiRequest(
    async () => {
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      });
      if (!res.ok) throw new Error('Failed to create');
      return newSession;
    },
    () => {
      const sessions = ls.getSessions();
      ls.saveSessions([newSession, ...sessions]);
      return newSession;
    },
    "Create session"
  );
};

export const updateSession = async (id: string, updates: Partial<Session>) => {
  return apiRequest(
    async () => {
      await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    },
    () => {
      const sessions = ls.getSessions();
      const updated = sessions.map(s => s.id === id ? { ...s, ...updates } : s);
      ls.saveSessions(updated);
    },
    "Update session"
  );
};

export const deleteSession = async (id: string) => {
  return apiRequest(
    async () => {
      await fetch(`${API_BASE_URL}/sessions/${id}`, { method: 'DELETE' });
    },
    () => {
      const sessions = ls.getSessions();
      ls.saveSessions(sessions.filter(s => s.id !== id));
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`messages_${id}`);
      }
    },
    "Delete session"
  );
};

export const searchSessions = async (query: string): Promise<Session[]> => {
  const sessions = await getSessions();
  if (!query) return sessions;
  const lowerQuery = query.toLowerCase();
  return sessions.filter(s => s.title.toLowerCase().includes(lowerQuery));
};

// --- Message Methods ---

export const getMessagesBySession = async (sessionId: string): Promise<Message[]> => {
  return apiRequest(
    async () => {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    () => ls.getMessages(sessionId),
    "Fetch messages"
  );
};

export const saveMessage = async (sessionId: string, role: Role, content: string, isError: boolean = false): Promise<Message> => {
  const newMessage: Message = {
    id: uuidv4(),
    sessionId,
    role,
    content,
    timestamp: Date.now(),
    isError
  };
  
  return apiRequest(
    async () => {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });
      if (!res.ok) throw new Error('Failed to save message');
      return newMessage;
    },
    () => {
      const messages = ls.getMessages(sessionId);
      ls.saveMessages(sessionId, [...messages, newMessage]);
      
      // Update session preview locally too
      const sessions = ls.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex >= 0) {
        const preview = content.substring(0, 60) + (content.length > 60 ? '...' : '');
        // Update specific fields
        sessions[sessionIndex] = { 
          ...sessions[sessionIndex], 
          updatedAt: Date.now(), 
          preview 
        };
        // Move to top
        const [updatedSession] = sessions.splice(sessionIndex, 1);
        sessions.unshift(updatedSession);
        ls.saveSessions(sessions);
      }
      return newMessage;
    },
    "Save message"
  );
};