import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import type { User } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!localStorage.getItem('token');

  const { data: currentUser } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: isAuthenticated,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      window.location.href = '/';
    },
    onError: () => {
      setError('Invalid username or password. Please try again.');
    },
  });

  const login = useCallback(
    (username: string, password: string) => {
      setError(null);
      loginMutation.mutate({ username, password });
    },
    [loginMutation]
  );

  const registerMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.register(username, password),
    onSuccess: (_, variables) => {
      login(variables.username, variables.password);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Registration failed. An account may already exist.';
      setError(msg);
    },
  });

  const registerAdmin = useCallback(
    (username: string, password: string) => {
      setError(null);
      registerMutation.mutate({ username, password });
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
    window.location.href = '/login';
  }, [queryClient]);

  return {
    login,
    registerAdmin,
    logout,
    currentUser,
    isAuthenticated,
    isLoggingIn: loginMutation.isPending || registerMutation.isPending,
    error,
  };
}
