import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';

const PatientHistory = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        id: report.id ?? index,
        risk: report.risk || report.severity || 'Unknown',
        advice:
          report.advice ||
          report.recommendations ||
          report.recommendation ||
          report.analysis ||
          'No advice provided.',
        analysis: report.analysis || report.summary || '',
        createdAt,
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
        <Link to="/patient-upload" className={uiTokens.primaryButton}>
          Upload New Scan
        </Link>
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
            <div key={report.id} className={`${uiTokens.card} p-4`}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Report #{report.id}
                </p>
                <p className="text-xs text-slate-500">
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleString()
                    : 'Date unknown'}
                </p>
              </div>
              <p className="mt-2 text-base">
                <strong>Risk:</strong> {report.risk}
              </p>
              <p className="mt-1 text-base">
                <strong>Advice:</strong> {report.advice}
              </p>
              {report.analysis && (
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                  {report.analysis}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
