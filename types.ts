export enum Role {
  User = 'user',
  Model = 'model'
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'zh';
export type SendKey = 'Enter' | 'Ctrl+Enter';
export type FontSize = 'small' | 'medium' | 'large';

export interface UserSettings {
  theme: Theme;
  language: Language;
  sendKey: SendKey;
  fontSize: FontSize;
  systemInstruction: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  preview: string; // Short preview of the last message
}

// Database Schema Reference (Requested by user)
/*
  If implementing this in a real Node.js/Postgres backend, here is the recommended Schema:

  TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  INDEX idx_messages_session_id ON messages(session_id);
  INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
*/