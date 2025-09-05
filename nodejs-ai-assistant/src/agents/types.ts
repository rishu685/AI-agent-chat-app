import type { Channel, StreamChat, User } from "stream-chat";

export interface AIAgent {
  user?: User;
  channel: Channel;
  chatClient: StreamChat;
  getLastInteraction: () => number;
  init: () => Promise<void>;
  dispose: () => Promise<void>;
}

export enum AgentPlatform {
  OPENAI = "openai",
  WRITING_ASSISTANT = "writing_assistant",
  GEMINI = "gemini",
}

// Extended message type for writing assistant features
export interface WritingMessage {
  custom?: {
    messageType?: "user_input" | "ai_response" | "system_message";
    writingTask?: string;
    suggestions?: string[];
  };
}

// Message request interface for AI agents
export interface MessageRequest {
  message: string;
  userId: string;
  userName?: string;
  channelId?: string;
  messageId?: string;
}
