import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';

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
    <div className="p-4">
      <h1 className="text-2xl font-bold">Doctor Dashboard</h1>

      {loading && <p className="mt-4">Loading patients...</p>}

      {!loading && error && (
        <p className="mt-4 text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && patients.length === 0 && (
        <p className="mt-4 text-gray-700">
          No patients are linked to your account yet.
        </p>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Patient
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {patient.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {patient.email || 'Not provided'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {patient.status}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <button
                      onClick={() => handleViewPatient(patient.id)}
                      className="text-blue-600 hover:underline"
                    >
                      View Reports
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
