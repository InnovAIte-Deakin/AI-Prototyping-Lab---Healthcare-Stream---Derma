import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get('/doctor/patients');
        const rawList = Array.isArray(res.data) ? res.data : res.data?.patients;
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
      } catch (err) {
        console.error(err);
        const message =
          err.response?.data?.detail ||
          'Could not load your patients. Please try again.';
        setError(message);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
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

      {!loading && !error && patients.length === 0 && (
        <p className="text-sm text-slate-600">
          No patients are linked to your account yet.
        </p>
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
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {patient.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {patient.email || 'Not provided'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{patient.status}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <button
                        onClick={() => handleViewPatient(patient.id)}
                        className={uiTokens.primaryButton}
                      >
                        View Reports
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
