import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════════════════
   SkinScope Design Tokens — Warm & Human-Centered

   These tokens ensure consistency across the app while maintaining
   the warm, approachable aesthetic that sets SkinScope apart.
   ═══════════════════════════════════════════════════════════════════════════ */

export const uiTokens = {
  // Primary action - warm terracotta
  primaryButton:
    'btn-warm',

  // Secondary action - soft, inviting
  secondaryButton:
    'btn-soft',

  // Doctor/Expert action - deep indigo
  accentButton:
    'btn-deep',

  // Input field
  input:
    'input-warm',

  // Standard card
  card:
    'card-warm',

  // Interactive card with hover
  cardInteractive:
    'card-warm cursor-pointer',

  // Badge variants
  badgeSuccess: 'badge-sage',
  badgeWarning: 'badge-amber',
  badgeInfo: 'badge-warm',
  badgeAccent: 'badge-deep',
  badgeNeutral: 'bg-charcoal-100 border border-charcoal-200 text-charcoal-600 text-xs font-semibold px-3 py-1 rounded-full',
};

// SkinScope Logo - warm, distinctive
const LogoMark = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer ring - skin/warmth */}
    <circle cx="18" cy="18" r="16" stroke="#e57040" strokeWidth="2" fill="none" />
    {/* Inner focus - the scope */}
    <circle cx="18" cy="18" r="8" fill="#e57040" fillOpacity="0.15" />
    <circle cx="18" cy="18" r="4" fill="#e57040" />
    {/* Cross hairs - precision/medical */}
    <path d="M18 6v6M18 24v6M6 18h6M24 18h6" stroke="#e57040" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Guest';

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header - warm, inviting */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isLandingPage
          ? 'bg-transparent'
          : 'bg-cream-50/90 backdrop-blur-sm border-b border-cream-300'
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link
            to={user ? (user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard') : '/'}
            className="flex items-center gap-3 group"
          >
            <LogoMark />
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-charcoal-900 tracking-tight">
                SkinScope
              </span>
              <span className="hidden sm:block text-[10px] font-medium uppercase tracking-widest text-warm-600">
                Dermatology Insights
              </span>
            </div>
          </Link>

          {/* User Area */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Role indicator */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                    user.role === 'doctor'
                      ? 'bg-deep-100 text-deep-700 border border-deep-200'
                      : 'bg-warm-100 text-warm-700 border border-warm-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full status-dot ${
                      user.role === 'doctor' ? 'bg-deep-500' : 'bg-warm-500'
                    }`} />
                    {roleLabel}
                  </div>
                </div>

                {/* Sign out */}
                <button
                  onClick={logout}
                  aria-label="Sign out"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-500 transition-colors hover:bg-cream-200 hover:text-charcoal-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-charcoal-600 transition-colors hover:text-charcoal-900"
                >
                  Sign in
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="btn-warm text-sm px-5 py-2.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer - subtle, warm */}
      <footer className="mt-auto border-t border-cream-200 bg-cream-100/50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3 text-sm text-charcoal-500">
              <LogoMark />
              <span className="font-medium text-charcoal-600">SkinScope</span>
              <span className="text-charcoal-300">·</span>
              <span>Understanding your skin, together</span>
            </div>
            <p className="text-xs text-charcoal-400">
              Not a substitute for professional medical advice
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
