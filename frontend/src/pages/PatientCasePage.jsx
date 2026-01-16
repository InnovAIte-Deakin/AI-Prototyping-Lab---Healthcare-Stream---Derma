import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import UnifiedChat from '../components/UnifiedChat';
import DisclaimerBanner from '../components/DisclaimerBanner';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending Review', className: 'badge-amber' },
    accepted: { label: 'Physician Active', className: 'badge-deep' },
    reviewed: { label: 'Review Complete', className: 'badge-sage' },
    none: { label: 'AI Only', className: 'bg-charcoal-100 border border-charcoal-200 text-charcoal-600 text-xs font-semibold px-3 py-1.5 rounded-full' },
  };
  const { label, className } = config[status] || config.none;

  return (
    <span className={`${className} px-4 py-2`}>
      {label}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ label, value, highlight }) => (
  <div className="rounded-xl bg-white border border-cream-200 p-4">
    <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400 mb-1">{label}</p>
    <p className={`text-sm font-bold ${highlight || 'text-charcoal-700'}`}>{value}</p>
  </div>
);

function PatientCasePage() {
  const { imageId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [ratingSuccess, setRatingSuccess] = useState(null);

  const fetchReport = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/analysis/image/${imageId}?t=${Date.now()}`);
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

  useEffect(() => {
    if (report?.patient_rating) {
      setRating(report.patient_rating);
      setFeedback(report.patient_feedback || '');
    }
  }, [report?.patient_rating, report?.patient_feedback]);

  const handleStatusChange = useCallback(() => {
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

  const handleSubmitRating = async (ratingValue, feedbackValue) => {
    if (!report?.report_id) return;
    const ratingToSubmit = ratingValue || rating;
    const feedbackToSubmit = feedbackValue !== undefined ? feedbackValue : feedback;

    if (!ratingToSubmit || ratingToSubmit < 1 || ratingToSubmit > 5) {
      setRatingError('Please select a rating from 1 to 5 stars.');
      return;
    }
    setIsSubmittingRating(true);
    setRatingError(null);
    setRatingSuccess(null);
    try {
      const payload = {
        rating: ratingToSubmit,
        feedback: feedbackToSubmit?.trim() ? feedbackToSubmit.trim() : null,
      };
      const res = await apiClient.post(`/cases/${report.report_id}/rating`, payload);
      setReport(prev => ({
        ...prev,
        patient_rating: res.data.patient_rating,
        patient_feedback: res.data.patient_feedback,
      }));
      setRatingSuccess('Thanks for your feedback! Your rating has been saved.');
    } catch (err) {
      setRatingError(err.response?.data?.detail || 'Could not submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Loading State
  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-cream-300 border-t-warm-500 rounded-full animate-spin mx-auto mb-4" />
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
        <Link to="/patient-history" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to History
        </Link>
      </div>
    );
  }

  const isPaused = report?.doctor_active === true && report?.review_status !== 'reviewed';
  const reviewStatus = report?.review_status || 'none';

  const severityColor = report?.severity === 'High' ? 'text-red-600' :
    report?.severity === 'Medium' ? 'text-amber-600' : 'text-sage-600';

  const statusColor = reviewStatus === 'accepted' ? 'text-deep-600' :
    reviewStatus === 'reviewed' ? 'text-sage-600' :
    reviewStatus === 'pending' ? 'text-amber-600' : 'text-charcoal-500';

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/patient-history"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to History
          </Link>
          <h1 className="text-3xl font-semibold text-charcoal-900">Case Details</h1>
          <p className="mt-1 text-charcoal-500">
            Condition: <span className="font-semibold text-charcoal-700">{report?.condition || 'Assessment Pending'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {reviewStatus === 'none' && (
            <button
              onClick={handleRequestReview}
              disabled={isRequestingReview}
              className="btn-deep"
            >
              {isRequestingReview ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Requesting...
                </span>
              ) : (
                'Request Physician Review'
              )}
            </button>
          )}
          <StatusBadge status={reviewStatus} />
        </div>
      </div>

      <DisclaimerBanner />

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
          value={reviewStatus === 'none' ? 'AI Only' : reviewStatus.charAt(0).toUpperCase() + reviewStatus.slice(1)}
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

      {/* Chat Interface */}
      {report?.report_id && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-charcoal-900">Conversation</h2>
            {isPaused && (
              <span className="badge-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-deep-300 status-dot" />
                Physician Active
              </span>
            )}
          </div>
          <UnifiedChat
            imageId={parseInt(imageId)}
            reportId={report.report_id}
            isPaused={isPaused}
            userRole="patient"
            onStatusChange={handleStatusChange}
            doctor={report?.doctor}
            // Rating props for inline rating card
            reviewStatus={reviewStatus}
            patientRating={report?.patient_rating}
            patientFeedback={report?.patient_feedback}
            onRatingSubmit={handleSubmitRating}
            ratingSuccess={ratingSuccess}
            ratingError={ratingError}
            isSubmittingRating={isSubmittingRating}
          />
        </div>
      )}

      {/* Pending Notice */}
      {reviewStatus === 'pending' && (
        <div className="card-warm p-5 bg-amber-50 border-amber-200 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 status-dot" />
            <p className="font-medium text-amber-800">
              A physician will review your case soon. You can continue chatting with the AI.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientCasePage;
