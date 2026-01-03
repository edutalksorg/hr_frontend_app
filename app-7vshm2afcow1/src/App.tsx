import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import routes from './routes';

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            ))}
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            {/* Fallback to login if route doesn't exist */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Synchronizing Session...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
