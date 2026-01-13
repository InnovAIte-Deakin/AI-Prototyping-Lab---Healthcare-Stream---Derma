import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';

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

      // Handle structured analysis data vs legacy string
      // Backend now returns flattened fields (condition, severity) AND 'analysis' object

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
        // Doctor info for historical display (from the case, not current link) - Task 7
        doctorId: report.doctor_id,
        doctorName: report.doctor_name,
      };
    });
  }, [reports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Patient History</h1>
          <p className="text-sm text-slate-500">
            Review previous AI analyses and recommendations.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            ← Dashboard
          </Link>
          <Link to="/patient-upload" className={uiTokens.primaryButton}>
            Upload New Scan
          </Link>
        </div>
      </div>

      <DisclaimerBanner />

      {loading && <p className="text-slate-600">Loading your reports...</p>}

      {!loading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && normalizedReports.length === 0 && (
        <p className="text-sm text-slate-600">
          No reports available yet. Upload a scan to generate your first report.
        </p>
      )}

      {!loading && !error && normalizedReports.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {normalizedReports.map((report) => (
            <article
              key={report.id}
              aria-label={`Case ${report.id}`}
              className={`${uiTokens.card} p-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all border-l-4 ${report.reviewStatus === 'accepted' ? 'border-l-indigo-500' :
                  report.reviewStatus === 'pending' ? 'border-l-yellow-500' :
                    report.reviewStatus === 'reviewed' ? 'border-l-green-500' : 'border-l-slate-200'
                }`}
              onClick={() => navigate(`/patient/case/${report.imageId}`)}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Report #{report.id}
                </p>
                <div className="flex items-center gap-2">
                  {report.reviewStatus === 'pending' && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">⏳ Pending</span>
                  )}
                  {report.reviewStatus === 'accepted' && (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">👨‍⚕️ Active</span>
                  )}
                  {report.reviewStatus === 'reviewed' && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">✅ Done</span>
                  )}
                  <p className="text-xs text-slate-500">
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleString()
                      : 'Date unknown'}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-base font-medium text-slate-900">
                  Condition: <span className="font-normal">{report.condition}</span>
                  {report.confidence && <span className="ml-2 text-slate-500 text-sm">({report.confidence}%)</span>}
                </p>

                <p className="text-sm">
                  <strong className="text-slate-700">Severity:</strong> {report.risk}
                </p>

                {report.characteristics && (
                  <p className="text-sm text-slate-600">
                    <strong className="text-slate-700">Features:</strong> {report.characteristics}
                  </p>
                )}

                {/* Doctor info - shows the original doctor who handled this case (Task 7) */}
                {report.doctorName && (
                  <p className="text-sm text-slate-600">
                    <strong className="text-slate-700">Reviewed by:</strong> {report.doctorName}
                    {report.reviewStatus && report.reviewStatus !== 'none' && (
                      <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${report.reviewStatus === 'reviewed'
                          ? 'bg-green-100 text-green-700'
                          : report.reviewStatus === 'accepted'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                        {report.reviewStatus}
                      </span>
                    )}
                  </p>
                )}

                <p className="mt-2 text-sm bg-blue-50 p-2 rounded text-blue-800 line-clamp-2">
                  <strong>Recommendation:</strong> {report.advice}
                </p>
              </div>

              <div className="mt-3 flex justify-end">
                <Link
                  to={`/patient/case/${report.imageId}`}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open Conversation →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
