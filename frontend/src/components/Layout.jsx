import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const uiTokens = {
  primaryButton:
    'inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
  input:
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400',
  card:
    'rounded-xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm',
};

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // Need to import this

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Guest';

  const pageHint = location?.pathname || '/';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-bold text-slate-900">
              SkinScope
            </Link>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Teledermatology
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">


            {/* ... wait let me rewrite the whole block to be cleaner */}
            <div className="hidden text-xs uppercase tracking-wide text-slate-400 sm:block">
              Current page
            </div>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 sm:inline-flex">
              {pageHint}
            </span>

            {user && (
              <>
                <div className="h-6 w-px bg-slate-200 sm:block" />
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Current role
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  {roleLabel}
                </div>
                <div className="h-6 w-px bg-slate-200 sm:block" />
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
