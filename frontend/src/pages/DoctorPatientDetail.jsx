import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';

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
        patientRating: report.patient_rating,
        patientFeedback: report.patient_feedback,
      };
    });
  }, [reports]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg text-xs font-black uppercase">⏳ Pending</span>;
      case 'accepted':
        return <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-black uppercase">🔵 In Progress</span>;
      case 'reviewed':
        return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-black uppercase">✅ Completed</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-black uppercase">AI Only</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/doctor-dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Patient Reports
          </h1>
          <p className="text-sm text-slate-500">
            View all analysis reports for this patient. Click on a case to manage it.
          </p>
        </div>
      </div>

      <DisclaimerBanner />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && normalizedReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No reports found for this patient yet.</p>
        </div>
      )}

      {!loading && !error && normalizedReports.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {normalizedReports.map((report) => (
            <div 
              key={report.id} 
              className={`${uiTokens.card} p-5 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-l-4 ${
                report.reviewStatus === 'accepted' ? 'border-l-indigo-500' : 
                report.reviewStatus === 'pending' ? 'border-l-yellow-500' : 
                report.reviewStatus === 'reviewed' ? 'border-l-green-500' : 'border-l-slate-200'
              }`}
              onClick={() => navigate(`/doctor/case/${report.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Case #{report.id}
                  </p>
                  <h3 className="font-bold text-slate-900">{report.condition}</h3>
                </div>
                {getStatusBadge(report.reviewStatus)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm" data-testid={`report-${report.id}-risk`}>
                  <span className="text-slate-500">Severity:</span>
                  <span className={`font-bold ${report.risk === 'High' ? 'text-red-600' : 'text-slate-700'}`}>
                    {report.risk}
                  </span>
                </div>
                {report.confidence && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Confidence</span>
                    <span className="font-bold text-slate-700">{report.confidence}%</span>
                  </div>
                )}
                <div className="flex justify-between text-sm" data-testid={`report-${report.id}-advice`}>
                  <span className="text-slate-500">Recommendation:</span>
                  <span className="text-slate-600 text-right max-w-[200px]">
                    {report.advice}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="text-slate-600">
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Patient Rating</span>
                  {report.patientRating ? (
                    <span className="font-bold text-amber-600">
                      {'★'.repeat(report.patientRating)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <span className="text-xs font-bold text-indigo-600">
                  {report.reviewStatus === 'pending' ? 'Review Case →' : 
                   report.reviewStatus === 'accepted' ? 'Continue Consultation →' : 
                   'View Details →'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorPatientDetail;
