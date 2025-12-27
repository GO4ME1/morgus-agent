// App Routes for Morgus
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Pricing } from './pages/Pricing';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Landing } from './pages/Landing';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { CreateMorgyPage } from './pages/CreateMorgyPage';
import { MarketplacePage } from './pages/MarketplacePage';
import App from './App';
import './LoadingScreen.css';
import { useEffect, useState } from 'react';

// Loading screen component
function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner-large"></div>
        <p>{message}</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin route wrapper - waits for both user and profile with timeout
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const [profileTimeout, setProfileTimeout] = useState(false);

  console.log('[AdminRoute] State:', { loading, hasUser: !!user, hasProfile: !!profile, isAdmin: profile?.is_admin, profileTimeout });

  // Set a timeout for profile loading (3 seconds after auth is done)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (!loading && user && !profile && !profileTimeout) {
      timeoutId = setTimeout(() => {
        console.log('[AdminRoute] Profile loading timed out');
        setProfileTimeout(true);
      }, 3000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, user, profile, profileTimeout]);

  // Still loading auth
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  // User exists but profile not yet loaded - wait a bit more (unless timed out)
  if (!profile && !profileTimeout) {
    return <LoadingScreen message="Loading profile..." />;
  }

  // Profile timed out - show error
  if (!profile && profileTimeout) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>⚠️ Profile Error</h2>
          <p>Unable to load your profile. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #00d4aa, #00b4d8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Refresh Page
          </button>
          <a href="/" className="back-link" style={{ display: 'block', marginTop: '1rem' }}>← Back to Morgus</a>
        </div>
      </div>
    );
  }

  // Not an admin
  if (profile && !profile.is_admin) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>🚫 Access Denied</h2>
          <p>You don't have admin privileges.</p>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Logged in as: {profile?.email}</p>
          <a href="/" className="back-link">← Back to Morgus</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/landing" element={<Landing />} />
      
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      
      {/* Protected routes */}
      <Route path="/account" element={
        <ProtectedRoute>
          <Account />
        </ProtectedRoute>
      } />
      
      <Route path="/knowledge-base" element={
        <ProtectedRoute>
          <KnowledgeBasePage />
        </ProtectedRoute>
      } />
      
      <Route path="/create-morgy" element={
        <ProtectedRoute>
          <CreateMorgyPage />
        </ProtectedRoute>
      } />
      
      <Route path="/marketplace" element={
        <ProtectedRoute>
          <MarketplacePage />
        </ProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <Admin />
        </AdminRoute>
      } />
      
      {/* Main app - accessible to all (with usage limits) */}
      <Route path="/*" element={<App />} />
    </Routes>
  );
}
