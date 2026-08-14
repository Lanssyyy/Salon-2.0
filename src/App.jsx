import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Appointments from '@/pages/Appointments';
import Customers from '@/pages/Customers';
import Staff from '@/pages/Staff';
import Inventory from '@/pages/Inventory';
import Invoices from '@/pages/Invoices';
import Expenses from '@/pages/Expenses';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import BookAppointment from '@/pages/BookAppointment';
import Terms from '@/pages/Terms';
import Documentation from '@/pages/Documentation';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/book" element={<BookAppointment />} />
      <Route path="/terms" element={<Terms />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  // Sync Android/iOS WebView dark mode preference with the 'dark' theme class
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (isDark) => {
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme(mql.matches);
    mql.addEventListener('change', (e) => applyTheme(e.matches));
    return () => mql.removeEventListener('change', (e) => applyTheme(e.matches));
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App