import { GoogleGenAI, Content } from "@google/genai";
import { Message, Role, Language } from "../types";

// Lazy initialization
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  if (aiInstance) return aiInstance;

  let apiKey = '';

  // 1. Check process.env (Node.js, Webpack, Parcel, Create React App)
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || 
               process.env.REACT_APP_API_KEY || 
               process.env.NEXT_PUBLIC_API_KEY || 
               '';
    }
  } catch (e) {
    // Ignore ReferenceError
  }

  // 2. Check import.meta.env (Vite standard)
  if (!apiKey && (import.meta as any).env) {
    const env = (import.meta as any).env;
    apiKey = env.VITE_API_KEY || env.API_KEY || '';
  }

  // 3. Final Fallback: Check global window object (if injected via script)
  if (!apiKey && (window as any).API_KEY) {
    apiKey = (window as any).API_KEY;
  }

  if (!apiKey) {
    // We throw a descriptive error so the UI can catch it
    throw new Error(
      "API Key is missing. Please check your .env file.\n" +
      "1. If using Vite, rename 'API_KEY' to 'VITE_API_KEY'.\n" +
      "2. If using Create React App, rename to 'REACT_APP_API_KEY'.\n" +
      "3. Restart your dev server after changing .env."
    );
  }

  // Initialize the client
  aiInstance = new GoogleGenAI({ apiKey: apiKey });
  return aiInstance;
};

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Converts our internal Message format to the GenAI Content format.
 */
const mapMessagesToHistory = (messages: Message[]): Content[] => {
  return messages.map((msg) => ({
    role: msg.role === Role.User ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
};

export const streamChatResponse = async (
  currentHistory: Message[],
  newMessage: string,
  onChunk: (text: string) => void,
  systemInstruction?: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    const history = mapMessagesToHistory(currentHistory);

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        systemInstruction: systemInstruction || undefined,
      }
    });

    const result = await chat.sendMessageStream({ message: newMessage });
    
    let fullText = '';
    
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }

    return fullText;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    // If the error is about the API key, throw a user-friendly message
    if (error.message && (error.message.includes('API Key') || error.message.includes('API_KEY'))) {
      throw error; 
    }
    throw new Error("Failed to communicate with Gemini API. Please check your connection or API key.");
  }
};

export const generateTitle = async (firstMessage: string, language: Language = 'en'): Promise<string | null> => {
  try {
    const ai = getAiClient();

    const prompt = language === 'zh'
      ? `为这段对话生成一个非常简短的标题（最多6个字）："${firstMessage}"。不要使用引号。`
      : `Generate a very short, concise title (max 6 words) for a conversation that starts with: "${firstMessage}". Do not use quotes.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    const title = response.text?.trim();
    // Return null if empty or looks like a default/error
    if (!title) return null;
    return title;
  } catch (e) {
    // Return null on failure so we don't overwrite with "New Chat"
    return null;
  }
};