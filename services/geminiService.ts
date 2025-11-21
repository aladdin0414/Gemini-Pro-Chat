import { GoogleGenAI, Content } from "@google/genai";
import { Message, Role, Language } from "../types";

// Initialize the client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const prompt = language === 'zh'
      ? `为这段对话生成一个非常简短的标题（最多6个字）："${firstMessage}"。不要使用引号。`
      : `Generate a very short, concise title (max 6 words) for a conversation that starts with: "${firstMessage}". Do not use quotes.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text?.trim() || (language === 'zh' ? "新对话" : "New Chat");
  } catch (e) {
    return language === 'zh' ? "新对话" : "New Chat";
  }
};