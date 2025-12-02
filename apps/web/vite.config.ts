/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'http://localhost:8080',
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'query-vendor': ['@tanstack/react-query'],
            'ui-vendor': ['lucide-react', 'react-hot-toast'],
            'websocket-vendor': ['@stomp/stompjs', 'sockjs-client'],

            // Feature chunks
            'auth-pages': [
              './pages/LoginPage.tsx',
              './pages/RegisterPage.tsx',
              './pages/ForgotPasswordPage.tsx',
            ],
            'chat-page': ['./pages/ChatPage.tsx'],
            stores: [
              './src/stores/authStore.ts',
              './src/stores/chatStore.ts',
              './src/stores/notificationStore.ts',
              './src/stores/typingStore.ts',
              './src/stores/userStore.ts',
            ],
            'api-hooks': [
              './src/hooks/api/useMessages.ts',
              './src/hooks/api/useConversations.ts',
              './src/hooks/api/useFriends.ts',
            ],
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 500,
      // Enable source maps for debugging
      sourcemap: mode === 'development',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './test/setup.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/dist/**',
        ],
      },
    },
  };
});
