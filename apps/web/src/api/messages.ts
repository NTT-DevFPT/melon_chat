import { client } from './client';
import { Message } from '../../types';

export interface EditMessageRequest {
  content: string;
}

export const editMessage = async (
  messageId: string,
  content: string
): Promise<Message> => {
  const response = await client.put<Message>(`/chats/messages/${messageId}`, {
    content,
  });
  return response.data;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await client.delete(`/chats/messages/${messageId}`);
};
