import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';

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
    <div>
      <h1>Doctor Patient Detail</h1>   {/* keep this heading text for the tests */}

      <div className="mt-2">
        <Link to="/doctor-dashboard" className="text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>

      {loading && <p className="mt-4">Loading reports...</p>}

      {!loading && error && (
        <p className="mt-4 text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && normalizedReports.length === 0 && (
        <p className="mt-4 text-gray-700">No reports found for this patient yet.</p>
      )}

      {!loading && !error && normalizedReports.length > 0 && (
        <div className="mt-6 space-y-4">
          {normalizedReports.map((report) => {
            const imageSrc = buildImageSrc(report.imageUrl);
            return (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Patient upload"
                      className="w-48 h-48 object-cover rounded-md border"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 text-gray-500 rounded-md border">
                      Image not available
                    </div>
                  )}

                  <div className="flex-1 min-w-[240px]">
                    <p className="text-sm text-gray-600">
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
                        <p className="text-sm text-gray-700 whitespace-pre-line">
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
