import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/src/api/client';
import { Message, MessageType } from '../../../types';

interface SendMessageRequest {
  content: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
}

// Normalize messages response (handle both array and paginated response)
const normalizeMessages = (payload: { content?: Message[] } | Message[]) => {
  if (Array.isArray(payload)) return payload;
  return payload?.content ?? [];
};

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await client.get<{ content?: Message[] } | Message[]>(
        `/chats/${conversationId}/messages`
      );
      return [...normalizeMessages(response.data)].reverse();
    },
    enabled: !!conversationId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: SendMessageRequest) => {
      if (!conversationId) throw new Error('No conversation selected');
      const response = await client.post<Message>(
        `/chats/${conversationId}/messages`,
        message
      );
      return response.data;
    },
    onMutate: async (newMessage) => {
      if (!conversationId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['messages', conversationId],
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>([
        'messages',
        conversationId,
      ]);

      // Optimistically update to the new value
      const optimisticMessage: Message = {
        id: 'temp-' + Date.now(),
        conversationId,
        senderId: '', // Will be filled by the server
        type: newMessage.type,
        content: newMessage.content,
        attachmentUrl: newMessage.attachmentUrl,
        attachmentName: newMessage.attachmentName,
        attachmentSize: newMessage.attachmentSize,
        createdAt: new Date().toISOString(),
        status: 'SENDING',
      };

      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (old = []) => [...old, optimisticMessage]
      );

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (conversationId && context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', conversationId],
          context.previousMessages
        );
      }
    },
    onSuccess: (data) => {
      // Update the optimistic message with the real data
      if (conversationId) {
        queryClient.setQueryData<Message[]>(
          ['messages', conversationId],
          (old = []) => {
            // Remove the optimistic message and add the real one
            const withoutOptimistic = old.filter(
              (msg) => !msg.id.startsWith('temp-')
            );
            return [...withoutOptimistic, data];
          }
        );

        // Invalidate conversations to update last message info
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', conversationId],
        });
      }
    },
  });
}

export function useMarkAsRead(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!conversationId) throw new Error('No conversation selected');
      await client.post(`/chats/${conversationId}/read`);
    },
    onSuccess: () => {
      // Invalidate conversations to update unread count
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      await client.delete(`/chats/messages/${messageId}`);
      return messageId;
    },
    onSuccess: (messageId) => {
      // Remove the message from all conversation caches
      queryClient.setQueriesData<Message[]>(
        { queryKey: ['messages'] },
        (old) => old?.filter((msg) => msg.id !== messageId) ?? []
      );

      // Invalidate conversations to update last message info
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
