import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/src/api/client';
import { User, PendingFriendRequest } from '../../../types';

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await client.get<User[]>('/friendships');
      return response.data;
    },
    staleTime: 15000, // 15 seconds
    gcTime: 300000, // 5 minutes
    // Removed refetchInterval - rely on WebSocket for real-time presence updates
  });
}

export function usePendingFriendRequests() {
  return useQuery({
    queryKey: ['pendingFriendRequests'],
    queryFn: async () => {
      const response = await client.get<PendingFriendRequest[]>(
        '/friendships/requests'
      );
      return response.data;
    },
    staleTime: 10000, // 10 seconds
    gcTime: 300000, // 5 minutes
    // Removed refetchInterval - rely on WebSocket for real-time updates
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: async () => {
      const response = await client.get<User[]>('/friendships/blocked');
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    // Removed refetchInterval - rely on WebSocket for real-time updates
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      await client.put(`/friendships/${friendshipId}/accept`);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      await client.put(`/friendships/${friendshipId}/reject`);
    },
    onSuccess: () => {
      // Invalidate pending requests
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // First unfriend if they are friends
      try {
        await client.delete(`/friendships/${userId}`);
      } catch (e) {
        // Ignore if not friends
      }
      // Then block
      await client.post(`/friendships/block/${userId}`);
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await client.delete(`/friendships/block/${userId}`);
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCheckIfBlockedBy(userId: string | null) {
  return useQuery({
    queryKey: ['blockedBy', userId],
    queryFn: async () => {
      if (!userId) return false;
      const response = await client.get<boolean>(
        `/friendships/blocked-by/${userId}`
      );
      return response.data;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

export function useUser(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await client.get<User>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}
