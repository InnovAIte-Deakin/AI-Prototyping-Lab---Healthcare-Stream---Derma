/* ═══════════════════════════════════════════════════════════════════════════
   AdminDashboard — Clinic Overview
   Updated to match DermaAI "Warm" Design System
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await apiClient.get('/admin/overview');
        setOverview(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-warm-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-charcoal-500 font-medium">Loading Overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Unable to load dashboard</h3>
          <p className="text-charcoal-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-warm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-charcoal-500 mt-1">Clinic-wide oversight and performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={overview?.total_patients ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          type="scent" // Using color variants if needed, or simple icon colors
          iconColor="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Doctors"
          value={overview?.total_doctors ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
          iconColor="text-emerald-500"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Pending Cases"
          value={overview?.pending_cases ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
          iconColor="text-amber-500"
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Avg Rating"
          value={overview?.average_rating ? `${overview.average_rating}` : '-'}
          subValue={overview?.average_rating ? '⭐' : ''}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
          iconColor="text-purple-500"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Recent Cases Section */}
      <div className="card-warm overflow-hidden">
        <div className="px-6 py-5 border-b border-cream-200 bg-cream-50/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal-900">Recent Cases</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-50 text-left">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 bg-white">
              {overview?.recent_cases?.length > 0 ? (
                overview.recent_cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal-900">
                      #{caseItem.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-600">
                      {caseItem.patient_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900">
                      {caseItem.condition || <span className="text-charcoal-400 italic">Pending analysis</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={caseItem.review_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-500">
                      {caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-charcoal-500">
                    <p className="text-lg font-medium text-charcoal-400">No cases found</p>
                    <p className="text-sm">New patient cases will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subValue, icon, iconColor, bgColor }) => (
  <div className="card-warm p-6 flex items-start justify-between transition-all hover:shadow-lg">
    <div>
      <p className="text-sm font-medium text-charcoal-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-charcoal-900">{value}</span>
        {subValue && <span className="text-lg text-charcoal-400">{subValue}</span>}
      </div>
    </div>
    <div className={`p-3 rounded-xl ${bgColor} ${iconColor}`}>
      {icon}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    none: 'bg-charcoal-100 text-charcoal-600 border-charcoal-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    accepted: 'bg-deep-100 text-deep-700 border-deep-200',
    reviewed: 'bg-sage-100 text-sage-800 border-sage-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'None';
  const styleClass = styles[status] || styles.none;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClass}`}>
      {label}
    </span>
  );
};

export default AdminDashboard;
