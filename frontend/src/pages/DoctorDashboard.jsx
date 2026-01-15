import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';

// Triage Card Component
const TriageCard = ({ task, onClick }) => (
  <div
    role="article"
    aria-label={`Case for ${task.patient_email}`}
    className={`${uiTokens.cardInteractive} p-5 border-l-4 border-l-red-500`}
    onClick={onClick}
  >
    <div className="flex justify-between items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{task.patient_email}</p>
        <p className="text-sm text-slate-500 mt-0.5">{task.condition || 'New Case'}</p>
      </div>
      <span className={uiTokens.badgeWarning}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 pulse-dot" />
        Pending
      </span>
    </div>
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-slate-400">
        {new Date(task.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}
      </p>
      <span className="text-sm font-medium text-teal-600 flex items-center gap-1">
        Review Case
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </div>
  </div>
);

// Patient Row Component
const PatientRow = ({ patient, hasPending, onView }) => (
  <tr className="hover:bg-slate-50/50 transition-colors">
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0">
          <span className="text-sm font-semibold text-white">
            {patient.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{patient.name}</p>
          {hasPending && (
            <span className="text-xs font-medium text-red-600">Action Required</span>
          )}
        </div>
      </div>
    </td>
    <td className="px-5 py-4 text-sm text-slate-600">
      {patient.email || 'Not provided'}
    </td>
    <td className="px-5 py-4">
      {hasPending ? (
        <span className={uiTokens.badgeWarning}>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 pulse-dot" />
          Pending
        </span>
      ) : (
        <span className={uiTokens.badgeSuccess}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      )}
    </td>
    <td className="px-5 py-4">
      <button
        onClick={() => onView(patient.id)}
        className={uiTokens.primaryButton}
      >
        View Reports
      </button>
    </td>
  </tr>
);

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Doctor Dashboard</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          Manage patient cases and review pending consultations
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={`${uiTokens.card} p-12 flex flex-col items-center justify-center`}>
          <div className="h-10 w-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
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

      {!loading && !error && (
        <>
          {/* Triage Section */}
          {pendingCases.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Triage Required</h2>
                  <p className="text-sm text-slate-500">
                    {pendingCases.length} case{pendingCases.length !== 1 ? 's' : ''} awaiting your review
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingCases.map((task, index) => (
                  <TriageCard
                    key={task.report_id ?? task.id ?? `pending-${index}`}
                    task={task}
                    onClick={() => navigate(`/doctor/case/${task.report_id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Patients Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Patients</h2>
                <p className="text-sm text-slate-500">
                  {patients.length} patient{patients.length !== 1 ? 's' : ''} linked to your practice
                </p>
              </div>
            </div>

            {patients.length === 0 ? (
              <div className={`${uiTokens.card} p-12 text-center`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No patients yet</h3>
                <p className="mt-2 text-slate-500">Patients will appear here when they link to your practice.</p>
              </div>
            ) : (
              <div className={`${uiTokens.card} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Patient
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Email
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patients.map((patient, index) => (
                        <PatientRow
                          key={patient.id ?? `patient-${index}`}
                          patient={patient}
                          hasPending={pendingCases.some((c) => c.patient_id === patient.id)}
                          onView={(id) => navigate(`/doctor/patients/${id}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
