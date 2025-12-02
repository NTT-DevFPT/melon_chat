import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/src/api/client';
import { Conversation, ConversationType } from '../../../types';

interface CreateGroupRequest {
  name: string;
  participantIds: string[];
}

export function useConversations(
  blockedUserIds: Set<string> = new Set(),
  currentUserId?: string
) {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await client.get<Conversation[]>('/chats');

      // Filter out conversations with blocked users (only for DIRECT conversations)
      const filtered = response.data.filter((conv) => {
        if (conv.type === ConversationType.DIRECT) {
          const participants = Array.isArray(conv.participants)
            ? conv.participants
            : [];
          const otherId = participants.find((id) => id !== currentUserId);
          if (!otherId) return true;
          return !blockedUserIds.has(otherId);
        }
        return true; // Keep all GROUP conversations
      });

      return filtered;
    },
    staleTime: 10000, // 10 seconds
    gcTime: 300000, // 5 minutes
    // Removed refetchInterval - rely on WebSocket for real-time updates
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      const response = await client.post<Conversation>('/chats/group', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: string) => {
      const response = await client.post<Conversation>(
        `/chats/direct/${friendId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
