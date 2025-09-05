import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { Channel, DefaultGenerics, Event, StreamChat } from "stream-chat";
import type { AIAgent } from "../types";

export class GeminiAgent implements AIAgent {
  private genAI?: GoogleGenerativeAI;
  private model?: GenerativeModel;
  private lastInteractionTs = Date.now();

  constructor(
    readonly chatClient: StreamChat,
    readonly channel: Channel
  ) {}

  dispose = async () => {
    this.chatClient.off("message.new", this.handleMessage);
    await this.chatClient.disconnectUser();
  };

  get user() {
    return this.chatClient.user;
  }

  getLastInteraction = (): number => this.lastInteractionTs;

  init = async () => {
    const apiKey = process.env.GOOGLE_AI_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("Google AI API key is required. Please set GOOGLE_AI_API_KEY in your .env file.");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-1.5-flash for free tier
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Test the API key
    try {
      await this.model.generateContent('Hello');
      console.log('✅ Google Gemini API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Gemini API:', error);
      throw new Error('Failed to initialize Google Gemini API. Please check your API key.');
    }

    this.chatClient.on("message.new", this.handleMessage);
  };

  private getAssistantPrompt = (): string => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    return `You are a helpful AI assistant powered by Google Gemini. You are participating in a chat application.

**Your Capabilities:**
- Helpful and informative responses
- Writing assistance and content creation
- General knowledge and problem solving
- Friendly conversational interaction

**Current Date**: ${currentDate}

**Instructions:**
- Be helpful, friendly, and engaging in your responses
- Provide accurate and useful information
- Keep responses conversational and appropriately sized for chat
- If you're unsure about something, say so honestly
- Be direct and clear in your communication

Your goal is to be a helpful AI assistant that provides valuable responses to users in this chat.`;
  };

  private handleMessage = async (e: Event<DefaultGenerics>) => {
    if (!this.model) {
      console.log("Gemini not initialized");
      return;
    }

    if (!e.message || e.message.ai_generated) {
      return;
    }

    const messageText = e.message.text;
    if (!messageText) return;

    this.lastInteractionTs = Date.now();

    try {
      // Send a placeholder message that we'll update with the response
      const { message: channelMessage } = await this.channel.sendMessage({
        text: "🤖 Thinking...",
        ai_generated: true,
      });

      // Send AI thinking indicator
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_THINKING",
        cid: channelMessage.cid,
        message_id: channelMessage.id,
      });

      // Create the prompt with context
      const systemPrompt = this.getAssistantPrompt();
      const userMessage = `${systemPrompt}\n\nUser: ${messageText}`;

      // Generate response from Gemini
      const result = await this.model.generateContent(userMessage);
      const response = await result.response;
      const aiResponse = response.text();

      if (!aiResponse) {
        throw new Error('No response generated from Gemini');
      }

      // Update the message with the actual response
      await this.chatClient.updateMessage({
        id: channelMessage.id,
        text: aiResponse,
      });

      // Send completion indicator
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_DONE",
        cid: channelMessage.cid,
        message_id: channelMessage.id,
      });

    } catch (error) {
      console.error('Error processing message with Gemini:', error);
      
      // Send error message to chat
      await this.channel.sendMessage({
        text: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ai_generated: true,
      });

      // Send error indicator
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_ERROR",
      });
    }
  };
}
