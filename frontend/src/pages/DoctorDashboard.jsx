import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';

const DoctorDashboard = () => {
  const [pendingCases, setPendingCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch pending cases
        const pendingRes = await apiClient.get('/cases/doctor/pending');
        setPendingCases(pendingRes.data?.cases || []);

        // Fetch all cases
        const allRes = await apiClient.get('/cases/doctor/all');
        setAllCases(allRes.data?.cases || []);
      } catch (err) {
        console.error('Failed to fetch cases:', err);
        setError('Failed to load cases. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const handleCaseClick = (reportId) => {
    navigate(`/doctor/case/${reportId}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      none: <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">No Request</span>,
      pending: <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">⏳ Pending</span>,
      accepted: <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">👁️ Reviewing</span>,
      reviewed: <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">✅ Reviewed</span>,
    };
    return badges[status] || badges.none;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderCaseTable = (cases) => {
    if (cases.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No cases found.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cases.map((caseItem) => (
              <tr
                key={caseItem.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCaseClick(caseItem.id)}
              >
                <td className="px-4 py-3">
                  <img
                    src={`http://localhost:8000${caseItem.image_url}`}
                    alt="Case"
                    className="w-12 h-12 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {caseItem.patient_email || `Patient #${caseItem.patient_id}`}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(caseItem.review_status)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(caseItem.created_at)}
                </td>
                <td className="px-4 py-3">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCaseClick(caseItem.id);
                    }}
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>

      {loading && <p className="text-gray-500">Loading cases...</p>}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-3xl font-bold text-yellow-600">{pendingCases.length}</p>
              <p className="text-sm text-yellow-800">Pending Reviews</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-3xl font-bold text-blue-600">
                {allCases.filter(c => c.review_status === 'accepted').length}
              </p>
              <p className="text-sm text-blue-800">In Progress</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-3xl font-bold text-green-600">
                {allCases.filter(c => c.review_status === 'reviewed').length}
              </p>
              <p className="text-sm text-green-800">Completed</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-4">
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingCases.length})
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab('all')}
              >
                All Cases ({allCases.length})
              </button>
            </nav>
          </div>

          {/* Case Table */}
          {activeTab === 'pending' && renderCaseTable(pendingCases)}
          {activeTab === 'all' && renderCaseTable(allCases)}
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;

