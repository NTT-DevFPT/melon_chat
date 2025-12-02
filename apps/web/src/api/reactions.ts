import { client } from './client';
import { MessageReaction } from '../../types';

export const reactionApi = {
  addReaction: async (
    messageId: string,
    emoji: string
  ): Promise<MessageReaction> => {
    const response = await client.post(
      `/chats/messages/${messageId}/reactions`,
      { emoji }
    );
    return response.data;
  },

  removeReaction: async (messageId: string, emoji: string): Promise<void> => {
    await client.delete(
      `/chats/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
    );
  },

  getMessageReactions: async (
    messageId: string
  ): Promise<MessageReaction[]> => {
    const response = await client.get(`/chats/messages/${messageId}/reactions`);
    return response.data;
  },

  getReactionCounts: async (
    messageId: string
  ): Promise<Record<string, number>> => {
    const response = await client.get(
      `/chats/messages/${messageId}/reactions/counts`
    );
    return response.data;
  },
};
