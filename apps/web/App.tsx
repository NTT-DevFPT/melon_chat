import React, { useEffect, Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonLoader } from './components/SkeletonLoader';
import { queryClient } from './src/lib/queryClient';

// Lazy load page components
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  }))
);
const ChatPage = lazy(() =>
  import('./pages/ChatPage').then((module) => ({ default: module.ChatPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  }))
);

// Loading fallback components
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center space-y-4">
      <SkeletonLoader variant="circular" width="80px" height="80px" />
      <SkeletonLoader width="200px" height="20px" />
      <SkeletonLoader width="150px" height="16px" />
    </div>
  </div>
);

const ChatLoadingFallback: React.FC = () => (
  <div className="flex h-screen bg-slate-950">
    {/* Sidebar skeleton */}
    <div className="w-80 border-r border-slate-800 bg-slate-900 p-4">
      <div className="space-y-4">
        <SkeletonLoader width="100%" height="40px" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <SkeletonLoader variant="circular" width="40px" height="40px" />
              <div className="flex-1 space-y-1">
                <SkeletonLoader width="60%" height="16px" />
                <SkeletonLoader width="80%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Main chat area skeleton */}
    <div className="flex-1 flex flex-col">
      {/* Header skeleton */}
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center space-x-3">
          <SkeletonLoader variant="circular" width="40px" height="40px" />
          <div className="space-y-1">
            <SkeletonLoader width="120px" height="16px" />
            <SkeletonLoader width="80px" height="12px" />
          </div>
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div className="max-w-xs space-y-1">
              <SkeletonLoader width="200px" height="40px" />
              <SkeletonLoader width="60px" height="12px" />
            </div>
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="border-t border-slate-800 p-4">
        <SkeletonLoader width="100%" height="48px" />
      </div>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <SkeletonLoader variant="circular" width="80px" height="80px" />
          <SkeletonLoader width="200px" height="20px" />
          <SkeletonLoader width="150px" height="16px" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthInitializer>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                },
              }}
            />
            <Routes>
              <Route
                path="/login"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <LoginPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/register"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <RegisterPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <ForgotPasswordPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Suspense fallback={<ChatLoadingFallback />}>
                        <ChatPage />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
            </Routes>
          </AuthInitializer>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
