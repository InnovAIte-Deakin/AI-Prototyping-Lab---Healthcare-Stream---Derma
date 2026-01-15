import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', className: 'badge-amber', dot: 'bg-amber-500' },
    accepted: { label: 'In Progress', className: 'badge-deep', dot: 'bg-deep-500' },
    reviewed: { label: 'Completed', className: 'badge-sage', dot: 'bg-sage-500' },
    none: { label: 'AI Only', className: 'bg-charcoal-100 border border-charcoal-200 text-charcoal-600 text-xs font-semibold px-3 py-1 rounded-full', dot: 'bg-charcoal-400' },
  };
  const { label, className, dot } = config[status] || config.none;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

// Case Card Component
const CaseCard = ({ report, onClick }) => {
  const borderColors = {
    pending: 'border-l-amber-400',
    accepted: 'border-l-deep-500',
    reviewed: 'border-l-sage-500',
    none: 'border-l-charcoal-300',
  };

  return (
    <article
      aria-label={`Case ${report.id}`}
      className={`card-warm p-5 border-l-4 cursor-pointer ${borderColors[report.reviewStatus] || borderColors.none}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-medium text-charcoal-400 mb-1">
            Case #{report.id}
          </p>
          <h3 className="text-lg font-semibold text-charcoal-900 line-clamp-1">
            {report.condition}
          </h3>
        </div>
        <StatusBadge status={report.reviewStatus} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-charcoal-500">Severity: </span>
            <span className={`font-semibold ${
              report.risk === 'High' ? 'text-red-600' :
              report.risk === 'Medium' ? 'text-amber-600' : 'text-sage-600'
            }`}>
              {report.risk}
            </span>
          </div>
          {report.confidence && (
            <div>
              <span className="text-charcoal-500">Confidence: </span>
              <span className="font-semibold text-charcoal-700">{report.confidence}%</span>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-cream-100 border border-cream-200 p-3">
          <p className="text-xs font-medium text-charcoal-500 mb-1">Recommendation</p>
          <p className="text-sm text-charcoal-700 line-clamp-2">{report.advice}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-200">
        <p className="text-xs text-charcoal-400">
          {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          }) : 'Date unknown'}
        </p>
        <span className="text-sm font-medium text-warm-600 flex items-center gap-1">
          View Details
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </article>
  );
};

const PatientHistory = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get('/api/analysis/patient/reports');
        const data = Array.isArray(res.data) ? res.data : res.data?.reports || [];
        setReports(data);
      } catch (err) {
        console.error(err);
        const message =
          err.response?.data?.detail ||
          'Unable to load your previous reports right now. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const normalizedReports = useMemo(() => {
    return reports.map((report, index) => {
      const createdAt = report.created_at || report.createdAt;

      return {
        id: report.report_id || report.id || index,
        risk: report.severity || report.risk || 'Unknown',
        condition: report.condition || 'Assessment Pending',
        confidence: report.confidence ? Math.round(report.confidence * 100) : null,
        advice:
          report.recommendation ||
          report.advice ||
          (typeof report.analysis === 'string' ? report.analysis : '') ||
          'No advice provided.',
        characteristics: Array.isArray(report.characteristics)
          ? report.characteristics.join(', ')
          : '',
        createdAt,
        reviewStatus: report.review_status || 'none',
        imageId: report.image_id,
      };
    });
  }, [reports]);

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-3xl font-semibold text-charcoal-900">Scan History</h1>
          <p className="mt-1 text-charcoal-500">
            Review your previous AI analyses and doctor consultations
          </p>
        </div>
        <Link to="/patient-upload" className="btn-warm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Scan
        </Link>
      </div>

      <DisclaimerBanner />

      {/* Loading State */}
      {loading && (
        <div className="card-warm p-12 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-cream-300 border-t-warm-500 rounded-full animate-spin mb-4" />
          <p className="text-charcoal-600">Loading your reports...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && normalizedReports.length === 0 && (
        <div className="card-warm p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 mb-4">
            <svg className="h-8 w-8 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charcoal-900">No reports yet</h3>
          <p className="mt-2 text-charcoal-500 mb-6">Upload a scan to generate your first AI analysis</p>
          <Link to="/patient-upload" className="btn-warm">
            Upload Your First Scan
          </Link>
        </div>
      )}

      {/* Reports Grid */}
      {!loading && !error && normalizedReports.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {normalizedReports.map((report) => (
            <CaseCard
              key={report.id}
              report={report}
              onClick={() => navigate(`/patient/case/${report.imageId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
