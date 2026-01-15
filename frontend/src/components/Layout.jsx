import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// Premium Design Tokens - SkinScope Medical Design System
// ═══════════════════════════════════════════════════════════════════════════

export const uiTokens = {
  // Primary action button - teal gradient with glow
  primaryButton:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_-2px_rgba(13,148,136,0.4)] transition-all duration-200 hover:shadow-[0_4px_16px_-4px_rgba(13,148,136,0.5)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_-2px_rgba(13,148,136,0.4)]',

  // Secondary button - subtle border
  secondaryButton:
    'inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',

  // Accent button - purple gradient
  accentButton:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_-2px_rgba(147,51,234,0.4)] transition-all duration-200 hover:shadow-[0_4px_16px_-4px_rgba(147,51,234,0.5)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',

  // Premium input field
  input:
    'w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10',

  // Elevated card with subtle shadow
  card:
    'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.02),0_4px_12px_0_rgb(0_0_0/0.03)]',

  // Interactive card with hover effect
  cardInteractive:
    'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.02),0_4px_12px_0_rgb(0_0_0/0.03)] transition-all duration-300 cursor-pointer hover:shadow-[0_4px_8px_0_rgb(0_0_0/0.03),0_12px_24px_0_rgb(0_0_0/0.05)] hover:-translate-y-1',

  // Section heading
  heading:
    'text-2xl font-bold tracking-tight text-slate-900',

  // Subheading text
  subheading:
    'text-[15px] text-slate-500 leading-relaxed',

  // Badge styles
  badgeSuccess:
    'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-emerald-700',
  badgeWarning:
    'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 px-3 py-1 text-xs font-semibold text-amber-700',
  badgeInfo:
    'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/60 px-3 py-1 text-xs font-semibold text-teal-700',
  badgeAccent:
    'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/60 px-3 py-1 text-xs font-semibold text-violet-700',
  badgeNeutral:
    'inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/60 px-3 py-1 text-xs font-semibold text-slate-600',
};

// Logo SVG Component
const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0d9488" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="url(#logoGradient)" />
    <path
      d="M16 8C11.582 8 8 11.582 8 16s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"
      fill="white"
      fillOpacity="0.9"
    />
    <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.9" />
    <path
      d="M16 11v2M16 19v2M11 16h2M19 16h2"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50">
      {/* Premium Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isLandingPage
          ? 'bg-transparent'
          : 'glass border-b border-slate-200/60'
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link
            to={user ? (user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard') : '/'}
            className="group flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <LogoIcon />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SkinScope
              </span>
              <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.15em] text-teal-600">
                Teledermatology
              </span>
            </div>
          </Link>

          {/* User Area */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Role Badge */}
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400">
                    Signed in as
                  </span>
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    user.role === 'doctor'
                      ? 'bg-gradient-to-br from-violet-50 to-purple-50 text-violet-700 border border-violet-200/60'
                      : 'bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 border border-teal-200/60'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      user.role === 'doctor' ? 'bg-violet-500' : 'bg-teal-500'
                    } pulse-dot`} />
                    {roleLabel}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  Sign in
                </Link>
                <Link
                  to="/login?mode=signup"
                  className={uiTokens.primaryButton}
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

      {/* Subtle Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <LogoIcon />
              <span className="font-medium text-slate-500">SkinScope</span>
              <span className="text-slate-300">|</span>
              <span>AI-Powered Dermatology Insights</span>
            </div>
            <p className="text-xs text-slate-400">
              Not a substitute for professional medical advice
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
