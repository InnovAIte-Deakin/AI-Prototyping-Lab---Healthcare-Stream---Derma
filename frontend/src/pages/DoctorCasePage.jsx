import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import UnifiedChat from '../components/UnifiedChat';
import { uiTokens } from '../components/Layout';

// Stat Card Component
const StatCard = ({ label, value, highlight }) => (
  <div className="rounded-xl bg-white border border-slate-200/60 p-4">
    <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{label}</p>
    <p className={`text-sm font-bold ${highlight || 'text-slate-700'}`}>{value}</p>
  </div>
);

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

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
        <Link to="/doctor-dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const reviewStatus = report?.review_status || 'pending';

  const severityColor = report?.severity === 'High' ? 'text-red-600' :
    report?.severity === 'Medium' ? 'text-amber-600' : 'text-emerald-600';

  const statusColor = reviewStatus === 'accepted' ? 'text-violet-600' :
    reviewStatus === 'reviewed' ? 'text-emerald-600' : 'text-amber-600';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/doctor-dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Case #{reportId}</h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Condition: <span className="font-semibold text-slate-700">{report?.condition || 'Assessment Pending'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {reviewStatus === 'pending' && (
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className={uiTokens.accentButton}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Accept Case'
              )}
            </button>
          )}
          {reviewStatus === 'accepted' && (
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className={uiTokens.primaryButton}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Complete Case'
              )}
            </button>
          )}
          {reviewStatus === 'reviewed' && (
            <span className={`${uiTokens.badgeSuccess} px-4 py-2`}>
              Finalized
            </span>
          )}
        </div>
      </div>

      {/* Case Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Severity"
          value={report?.severity || 'Unknown'}
          highlight={severityColor}
        />
        <StatCard
          label="Confidence"
          value={report?.confidence ? `${Math.round(report.confidence)}%` : 'N/A'}
        />
        <StatCard
          label="Status"
          value={reviewStatus.charAt(0).toUpperCase() + reviewStatus.slice(1)}
          highlight={statusColor}
        />
        <StatCard
          label="Created"
          value={report?.created_at ? new Date(report.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          }) : 'Unknown'}
        />
      </div>

      {/* AI Recommendation */}
      <div className={`${uiTokens.card} p-5 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 border-teal-200/60`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 flex-shrink-0">
            <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">AI Recommendation</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {report?.recommendation || 'No recommendation available.'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Interface - Show for accepted cases */}
      {reviewStatus === 'accepted' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Patient Consultation</h2>
          <UnifiedChat
            imageId={report.image_id}
            reportId={parseInt(reportId)}
            isPaused={true}
            userRole="doctor"
          />
        </div>
      )}

      {/* Pending state */}
      {reviewStatus === 'pending' && (
        <div className={`${uiTokens.card} p-8 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200/60 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-amber-800 mb-2">Case Awaiting Review</h3>
          <p className="text-amber-700 mb-6">Accept this case to begin consulting with the patient and access the chat interface.</p>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className={uiTokens.accentButton}
          >
            {isProcessing ? 'Processing...' : 'Accept & Start Consultation'}
          </button>
        </div>
      )}

      {/* Reviewed state */}
      {reviewStatus === 'reviewed' && (
        <div className={`${uiTokens.card} p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Case Completed</h3>
          <p className="text-emerald-700">This consultation has been finalized. The patient has been notified.</p>
        </div>
      )}
    </div>
  );
}

export default DoctorCasePage;
