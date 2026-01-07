import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import UnifiedChat from '../components/UnifiedChat';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';

function PatientCasePage() {
  const { imageId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequestingReview, setIsRequestingReview] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      console.log('[PatientCasePage] Fetching report...');
      // Add timestamp to prevent browser caching
      const res = await apiClient.get(`/api/analysis/image/${imageId}?t=${Date.now()}`);
      console.log('[PatientCasePage] Report data:', res.data);
      setReport(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Could not load case details.');
    }
  }, [imageId]);

  useEffect(() => {
    if (imageId) {
      setLoading(true);
      fetchReport().finally(() => setLoading(false));
    }
  }, [imageId, fetchReport]);

  const handleStatusChange = useCallback(() => {
    // Refresh report when status changes (e.g., doctor accepts or closes case)
    console.log('[PatientCasePage] Status change detected, refreshing...');
    // Add a small delay to ensure DB propagation and avoid race conditions
    setTimeout(() => {
        fetchReport();
    }, 500);
  }, [fetchReport]);

  const handleRequestReview = async () => {
    if (!report?.report_id) return;
    setIsRequestingReview(true);
    try {
      const res = await apiClient.post(`/cases/${report.report_id}/request-review`);
      setReport(prev => ({ ...prev, review_status: res.data.review_status }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request review');
    } finally {
      setIsRequestingReview(false);
    }
  };

  // Only show full page spinner on INITIAL load to prevent Chat unmounting
  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link to="/patient-history" className="text-indigo-600 font-semibold text-sm hover:underline">← Back to History</Link>
      </div>
    );
  }

  // Calculate derived state: Pause AI only if doctor is active AND case is NOT reviewed (closed)
  const isPaused = report?.doctor_active === true && report?.review_status !== 'reviewed';
  const reviewStatus = report?.review_status || 'none';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/patient-history" className="text-indigo-600 font-semibold text-sm hover:underline mb-2 inline-block">← Back to History</Link>
          <h1 className="text-2xl font-bold text-slate-900">Your Case</h1>
          <p className="text-slate-500 text-sm">
            Condition: <span className="font-medium text-slate-800">{report?.condition || 'Assessment Pending'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {reviewStatus === 'none' && (
            <button
              onClick={handleRequestReview}
              disabled={isRequestingReview}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg"
            >
              {isRequestingReview ? '⏳ Requesting...' : '📨 Request Physician Review'}
            </button>
          )}
          {reviewStatus === 'pending' && (
            <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-sm font-black uppercase">⏳ Pending Review</span>
          )}
          {reviewStatus === 'accepted' && (
            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-black uppercase">👨‍⚕️ Physician Active</span>
          )}
          {reviewStatus === 'reviewed' && (
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-black uppercase">✅ Review Complete</span>
          )}
        </div>
      </div>

      <DisclaimerBanner />

      {/* Case Info */}
      <div className={`${uiTokens.card} p-5 grid grid-cols-2 md:grid-cols-4 gap-4`}>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Severity</p>
          <p className={`text-sm font-black ${report?.severity === 'High' ? 'text-red-600' : 'text-slate-700'}`}>{report?.severity || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Confidence</p>
          <p className="text-sm font-black text-slate-700">{report?.confidence ? `${Math.round(report.confidence)}%` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
          <p className={`text-sm font-black uppercase ${reviewStatus === 'accepted' ? 'text-indigo-600' : reviewStatus === 'reviewed' ? 'text-green-600' : reviewStatus === 'pending' ? 'text-yellow-600' : 'text-slate-500'}`}>
            {reviewStatus === 'none' ? 'AI Only' : reviewStatus}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Created</p>
          <p className="text-sm font-medium text-slate-700">{report?.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown'}</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">AI Recommendation</p>
        <p className="text-sm font-medium text-blue-900 leading-relaxed italic">"{report?.recommendation || 'No recommendation available.'}"</p>
      </div>

      {/* Chat Interface */}
      {report?.report_id && (
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">💬 Conversation</h2>
          <UnifiedChat 
            imageId={parseInt(imageId)}
            reportId={report.report_id}
            isPaused={isPaused}
            userRole="patient"
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {reviewStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
          <p className="text-yellow-800 text-sm font-medium">A physician will review your case soon. You can still chat with the AI in the meantime.</p>
        </div>
      )}
    </div>
  );
}

export default PatientCasePage;
