import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import UnifiedChat from '../components/UnifiedChat';

// Stat Card Component
const StatCard = ({ label, value, highlight }) => (
  <div className="rounded-xl bg-white border border-cream-200 p-4">
    <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400 mb-1">{label}</p>
    <p className={`text-sm font-bold ${highlight || 'text-charcoal-700'}`}>{value}</p>
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
          <div className="h-12 w-12 border-4 border-cream-300 border-t-deep-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-charcoal-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4 animate-enter">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
        <Link to="/doctor-dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700">
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
    report?.severity === 'Medium' ? 'text-amber-600' : 'text-sage-600';

  const statusColor = reviewStatus === 'accepted' ? 'text-deep-600' :
    reviewStatus === 'reviewed' ? 'text-sage-600' : 'text-amber-600';

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/doctor-dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold text-charcoal-900">Case #{reportId}</h1>
          <p className="mt-1 text-charcoal-500">
            Condition: <span className="font-semibold text-charcoal-700">{report?.condition || 'Assessment Pending'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {reviewStatus === 'pending' && (
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="btn-deep"
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
              className="btn-warm"
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
            <span className="badge-sage px-4 py-2">
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
      <div className="card-warm p-5 bg-warm-50 border-warm-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-100 flex-shrink-0">
            <svg className="h-5 w-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-700 mb-1">AI Recommendation</p>
            <p className="text-sm text-charcoal-700 leading-relaxed">
              {report?.recommendation || 'No recommendation available.'}
            </p>
          </div>
        </div>
      </div>

      {report?.patient_rating && (
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
          <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Patient Rating</p>
          <div className="flex items-center gap-1 text-amber-500 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star}>{star <= report.patient_rating ? '★' : '☆'}</span>
            ))}
          </div>
          {report?.patient_feedback && (
            <p className="text-sm text-amber-900 italic">“{report.patient_feedback}”</p>
          )}
        </div>
      )}

      {/* Chat Interface - Show for accepted cases */}
      {reviewStatus === 'accepted' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-charcoal-900">Patient Consultation</h2>
          <UnifiedChat
            imageId={report.image_id}
            reportId={parseInt(reportId)}
            isPaused={true}
            userRole="doctor"
            onStatusChange={() => {
              console.log('DoctorCasePage: Received status update, refreshing...');
              // We could fetchReport here if we wanted the doctor UI to update on external changes
            }}
          />
        </div>
      )}

      {/* Pending state */}
      {reviewStatus === 'pending' && (
        <div className="card-warm p-8 bg-amber-50 border-amber-200 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-amber-800 mb-2">Case Awaiting Review</h3>
          <p className="text-amber-700 mb-6">Accept this case to begin consulting with the patient and access the chat interface.</p>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="btn-deep"
          >
            {isProcessing ? 'Processing...' : 'Accept & Start Consultation'}
          </button>
        </div>
      )}

      {/* Reviewed state */}
      {reviewStatus === 'reviewed' && (
        <div className="card-warm p-8 bg-sage-50 border-sage-200 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 mb-4">
            <svg className="h-8 w-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-sage-800 mb-2">Case Completed</h3>
          <p className="text-sage-700">This consultation has been finalized. The patient has been notified.</p>
        </div>
      )}
    </div>
  );
}

export default DoctorCasePage;
