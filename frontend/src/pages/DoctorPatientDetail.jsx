import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', className: uiTokens.badgeWarning },
    accepted: { label: 'In Progress', className: uiTokens.badgeAccent },
    reviewed: { label: 'Completed', className: uiTokens.badgeSuccess },
    none: { label: 'AI Only', className: uiTokens.badgeNeutral },
  };
  const { label, className } = config[status] || config.none;
  return <span className={className}>{label}</span>;
};

// Report Card Component
const ReportCard = ({ report, onClick }) => {
  const borderColors = {
    pending: 'border-l-amber-500',
    accepted: 'border-l-violet-500',
    reviewed: 'border-l-emerald-500',
    none: 'border-l-slate-300',
  };

  const actionLabels = {
    pending: 'Review Case',
    accepted: 'Continue Consultation',
    reviewed: 'View Details',
    none: 'View Details',
  };

  return (
    <div
      className={`${uiTokens.cardInteractive} p-5 border-l-4 ${borderColors[report.reviewStatus] || borderColors.none}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">Case #{report.id}</p>
          <h3 className="text-lg font-semibold text-slate-900">{report.condition}</h3>
        </div>
        <StatusBadge status={report.reviewStatus} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between" data-testid={`report-${report.id}-risk`}>
          <span className="text-slate-500">Severity</span>
          <span className={`font-semibold ${report.risk === 'High' ? 'text-red-600' : 'text-slate-700'}`}>
            {report.risk}
          </span>
        </div>
        {report.confidence && (
          <div className="flex justify-between">
            <span className="text-slate-500">Confidence</span>
            <span className="font-semibold text-slate-700">{report.confidence}%</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span className="text-slate-600">
            {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            }) : 'Unknown'}
          </span>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2" data-testid={`report-${report.id}-advice`}>
          {report.advice}
        </p>
        <span className="text-sm font-medium text-teal-600 flex items-center gap-1">
          {actionLabels[report.reviewStatus] || 'View Details'}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
};

function DoctorPatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) {
      setError('No patient selected.');
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get(
          `/api/analysis/doctor/patients/${patientId}/reports`
        );
        const data = Array.isArray(res.data) ? res.data : res.data?.reports || [];
        setReports(data);
      } catch (err) {
        console.error(err);
        const message =
          err.response?.data?.detail ||
          'Could not load reports for this patient. Please try again.';
        setError(message);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [patientId]);

  const normalizedReports = useMemo(() => {
    return reports.map((report, index) => {
      const createdAt = report.created_at || report.createdAt;

      return {
        id: report.report_id || report.id || index,
        risk: report.severity || report.risk || 'Unknown',
        condition: report.condition || 'Assessment Pending',
        confidence: report.confidence ? Math.round(report.confidence) : null,
        advice: report.recommendation || report.advice || 'No advice provided.',
        createdAt,
        reviewStatus: report.review_status || 'none',
        imageId: report.image_id,
      };
    });
  }, [reports]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Patient Reports</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          View all analysis reports for this patient. Click a case to manage it.
        </p>
      </div>

      <DisclaimerBanner />

      {/* Loading State */}
      {loading && (
        <div className={`${uiTokens.card} p-12 flex flex-col items-center justify-center`}>
          <div className="h-10 w-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-600">Loading reports...</p>
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
        <div className={`${uiTokens.card} p-12 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No reports yet</h3>
          <p className="mt-2 text-slate-500">This patient has not submitted any scans for analysis.</p>
        </div>
      )}

      {/* Reports Grid */}
      {!loading && !error && normalizedReports.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {normalizedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => navigate(`/doctor/case/${report.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorPatientDetail;
