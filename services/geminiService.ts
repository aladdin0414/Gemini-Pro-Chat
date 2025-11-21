import { GoogleGenAI, Content } from "@google/genai";
import { Message, Role, Language } from "../types";

// Lazy initialization to prevent crash on load if key is missing or env vars aren't ready
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  if (aiInstance) return aiInstance;

  // Attempt to get the key from process.env (Standard) or import.meta.env (Vite)
  // Note: In Vite, you usually must prefix variables with VITE_ (e.g., VITE_API_KEY) in your .env file.
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_API_KEY in your .env file.");
  }

  aiInstance = new GoogleGenAI({ apiKey });
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
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Create a chat session with the history (excluding the new message we are about to send if it was optimistically added, 
    // but typically we pass the history *before* the new prompt)
    const history = mapMessagesToHistory(currentHistory);

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192, // Reasonable limit for chat
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
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

export const generateTitle = async (firstMessage: string, language: Language = 'en'): Promise<string> => {
  try {
    const ai = getAiClient();

    const prompt = language === 'zh'
      ? `为这段对话生成一个非常简短的标题（最多6个字）："${firstMessage}"。不要使用引号。`
      : `Generate a very short, concise title (max 6 words) for a conversation that starts with: "${firstMessage}". Do not use quotes.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text?.trim() || (language === 'zh' ? "新对话" : "New Chat");
  } catch (e) {
    // If API fails (e.g. no key), just return default
    return language === 'zh' ? "新对话" : "New Chat";
  }
};