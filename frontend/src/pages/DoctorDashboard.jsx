import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [patientsRes, pendingRes] = await Promise.all([
          apiClient.get('/doctor/patients'),
          apiClient.get('/cases/pending')
        ]);

        const rawList = Array.isArray(patientsRes.data) ? patientsRes.data : patientsRes.data?.patients;
        const normalized = Array.isArray(rawList)
          ? rawList.map((patient, index) => {
              const id = patient.id ?? patient.patient_id ?? patient.user_id ?? index;
              return {
                id,
                name:
                  patient.full_name ||
                  patient.name ||
                  patient.patient_name ||
                  `Patient ${id}`,
                email: patient.email || '',
                status: patient.status || patient.link_status || 'linked',
              };
            })
          : [];

        setPatients(normalized);
        setPendingCases(pendingRes.data || []);
      } catch (err) {
        console.error(err);
        const message =
          err.response?.data?.detail ||
          'Could not load dashboard data. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">Doctor Dashboard</h1>
        <p className="text-sm text-slate-500">
          Review linked patients and open their report timelines.
        </p>
      </div>

      {loading && <p className="text-slate-600">Loading patients...</p>}

      {!loading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Triage Section */}
          {pendingCases.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                🚨 Triage Required
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  {pendingCases.length} New
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingCases.map((task) => (
                  <div 
                    key={task.report_id} 
                    className={`${uiTokens.card} p-4 border-l-4 border-l-red-500 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer`}
                    onClick={() => navigate(`/doctor/case/${task.report_id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">{task.patient_email}</p>
                        <p className="text-sm text-slate-500">{task.condition || 'New Case'}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <span className="text-xs font-bold text-indigo-600">Open Case →</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {patients.length === 0 && (
            <p className="text-sm text-slate-600">
              No patients are linked to your account yet.
            </p>
          )}
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className={`${uiTokens.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Patient
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {patients.map((patient) => {
                  const hasPending = pendingCases.some((c) => c.patient_id === patient.id);
                  return (
                    <tr key={patient.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {patient.name}
                          {hasPending && (
                            <span
                              className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"
                              title="Needs Attention"
                            ></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {patient.email || 'Not provided'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {hasPending ? (
                          <span className="text-red-600 font-semibold text-xs">
                            Action Required
                          </span>
                        ) : (
                          patient.status
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <button
                          onClick={() => handleViewPatient(patient.id)}
                          className={uiTokens.primaryButton}
                        >
                          View Reports
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
