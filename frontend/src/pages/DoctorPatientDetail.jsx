import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';

function DoctorPatientDetail() {
  const { patientId } = useParams();
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
      const imageUrl = report.image_url || report.imageUrl || report.image;
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
        imageUrl,
      };
    });
  }, [reports]);

  const buildImageSrc = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Doctor Patient Detail
          </h1>{' '}
          {/* keep this heading text for the tests */}
          <p className="text-sm text-slate-500">
            Review AI-generated reports for this patient before clinical follow-up.
          </p>
        </div>
        <Link
          to="/doctor-dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          ← Back to dashboard
        </Link>
      </div>

      <DisclaimerBanner />

      {loading && <p className="text-slate-600">Loading reports...</p>}

      {!loading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && normalizedReports.length === 0 && (
        <p className="text-sm text-slate-600">No reports found for this patient yet.</p>
      )}

      {!loading && !error && normalizedReports.length > 0 && (
        <div className="space-y-4">
          {normalizedReports.map((report) => {
            const imageSrc = buildImageSrc(report.imageUrl);
            return (
              <div key={report.id} className={`${uiTokens.card} p-4`}>
                <div className="flex flex-wrap items-start gap-4">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Patient upload"
                      className="h-48 w-48 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-md border bg-slate-100 text-slate-500">
                      Image not available
                    </div>
                  )}

                  <div className="flex-1 min-w-[240px] space-y-1">
                    <p className="text-sm text-slate-600">
                      Report ID: {report.id} |{' '}
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleString()
                        : 'Date unknown'}
                    </p>
                    <p className="mt-2 text-base" data-testid={`report-${report.id}-risk`}>
                      <strong>Risk:</strong> {report.risk}
                    </p>
                    <p className="mt-1 text-base" data-testid={`report-${report.id}-advice`}>
                      <strong>Advice:</strong> {report.advice}
                    </p>

                    {report.analysis && (
                      <div className="mt-2">
                        <p className="whitespace-pre-line text-sm text-slate-700">
                          {report.analysis}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DoctorPatientDetail;
