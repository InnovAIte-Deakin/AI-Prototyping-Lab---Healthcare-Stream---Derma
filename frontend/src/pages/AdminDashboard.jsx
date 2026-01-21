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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-purple-300">Clinic-wide oversight and metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Patients"
            value={overview?.total_patients ?? 0}
            icon="👥"
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total Doctors"
            value={overview?.total_doctors ?? 0}
            icon="🩺"
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Pending Cases"
            value={overview?.pending_cases ?? 0}
            icon="📋"
            color="from-amber-500 to-amber-600"
          />
          <StatCard
            title="Avg Rating"
            value={overview?.average_rating ? `${overview.average_rating} ⭐` : 'N/A'}
            icon="⭐"
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Recent Cases Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Recent Cases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {overview?.recent_cases?.length > 0 ? (
                  overview.recent_cases.map((caseItem) => (
                    <tr key={caseItem.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        #{caseItem.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                        {caseItem.patient_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {caseItem.condition || 'Pending'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={caseItem.review_status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                        {caseItem.created_at
                          ? new Date(caseItem.created_at).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-purple-300">
                      No cases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-xl`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusStyles = {
    none: 'bg-gray-500/20 text-gray-300',
    pending: 'bg-amber-500/20 text-amber-300',
    accepted: 'bg-blue-500/20 text-blue-300',
    reviewed: 'bg-emerald-500/20 text-emerald-300',
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        statusStyles[status] || statusStyles.none
      }`}
    >
      {status || 'none'}
    </span>
  );
};

export default AdminDashboard;
