import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import UnifiedChat from '../components/UnifiedChat';
import { uiTokens } from '../components/Layout';

function DoctorCasePage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/analysis/report/${reportId}`);
        setReport(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Could not load case details.');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) fetchReport();
  }, [reportId]);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const res = await apiClient.post(`/cases/${reportId}/accept`);
      setReport(prev => ({ ...prev, review_status: res.data.review_status, doctor_active: res.data.doctor_active }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept case');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/cases/${reportId}/complete`);
      navigate('/doctor-dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete case');
      setIsProcessing(false);
    }
  };

  if (loading) {
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
        <Link to="/doctor-dashboard" className="text-indigo-600 font-semibold text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/doctor-dashboard" className="text-indigo-600 font-semibold text-sm hover:underline mb-2 inline-block">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900">Case #{reportId}</h1>
          <p className="text-slate-500 text-sm">
            Condition: <span className="font-medium text-slate-800">{report?.condition || 'Assessment Pending'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {report?.review_status === 'pending' && (
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
            >
              {isProcessing ? '⏳ Processing...' : '🤝 Accept Case'}
            </button>
          )}
          {report?.review_status === 'accepted' && (
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg"
            >
              {isProcessing ? '⏳ Processing...' : '✅ Close Case'}
            </button>
          )}
          {report?.review_status === 'reviewed' && (
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-black uppercase">Finalized</span>
          )}
        </div>
      </div>

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
          <p className={`text-sm font-black uppercase ${report?.review_status === 'accepted' ? 'text-indigo-600' : report?.review_status === 'reviewed' ? 'text-green-600' : 'text-yellow-600'}`}>
            {report?.review_status}
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

      {/* Chat Interface - Show for accepted cases */}
      {report?.review_status === 'accepted' && (
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">💬 Patient Consultation</h2>
          <UnifiedChat 
            imageId={report.image_id}
            reportId={parseInt(reportId)}
            isPaused={true}
            userRole="doctor"
          />
        </div>
      )}

      {/* Pending state - show accept prompt */}
      {report?.review_status === 'pending' && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h3 className="text-xl font-bold text-yellow-800 mb-2">Case Awaiting Review</h3>
          <p className="text-yellow-700 mb-6">Accept this case to begin consulting with the patient and access the chat interface.</p>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {isProcessing ? '⏳ Processing...' : '🤝 Accept & Start Consultation'}
          </button>
        </div>
      )}

      {/* Reviewed state - case closed */}
      {report?.review_status === 'reviewed' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">Case Completed</h3>
          <p className="text-green-700">This consultation has been finalized. The patient has been notified.</p>
        </div>
      )}
    </div>
  );
}

export default DoctorCasePage;
