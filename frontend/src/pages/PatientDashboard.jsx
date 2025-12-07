import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';

function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectingDoctorId, setSelectingDoctorId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        // First: see if the patient already has a doctor
        const myDoctorRes = await apiClient.get('/patient/my-doctor');
        setCurrentDoctor(myDoctorRes.data.doctor);
      } catch (err) {
        // If 404 or similar, assume no doctor yet: load list of doctors
        const status = err?.response?.status;

        if (status === 404) {
          try {
            const doctorsRes = await apiClient.get('/doctors');
            setAvailableDoctors(doctorsRes.data || []);
          } catch (innerErr) {
            console.error(innerErr);
            setError('Could not load available doctors. Please try again later.');
          }
        } else {
          console.error(err);
          setError('Could not load your doctor information. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorInfo();
  }, []);

  const handleSelectDoctor = async (doctor) => {
    try {
      setSelectingDoctorId(doctor.id ?? doctor.doctor_id);
      setError(null);

      const doctorId = doctor.id ?? doctor.doctor_id;
      await apiClient.post('/patient/select-doctor', { doctor_id: doctorId });

      // After selecting, treat this doctor as the current doctor
      setCurrentDoctor(doctor);
      setAvailableDoctors([]);
    } catch (err) {
      console.error(err);
      setError('Failed to select doctor. Please try again.');
    } finally {
      setSelectingDoctorId(null);
    }
  };

  const handleNewScan = () => {
    navigate('/patient-upload');
  };

  const handleViewHistory = () => {
    navigate('/patient-history');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {/* dY`Ø This heading text is important for the tests */}
          <h1 className="text-3xl font-semibold text-slate-900">Patient Dashboard</h1>
          <p className="text-sm text-slate-500">
            Manage your dermatologist connection and keep track of your scans.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={uiTokens.primaryButton} onClick={handleNewScan}>
            New Scan
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleViewHistory}
          >
            View History
          </button>
        </div>
      </div>

      {loading && <p className="text-slate-600">Loading...</p>}

      {!loading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && currentDoctor && (
        <div className={`${uiTokens.card} p-5`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Your doctor</p>
              <h2 className="text-xl font-semibold text-slate-900">
                {currentDoctor.full_name ?? 'Unknown'}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Active care team
            </div>
          </div>

          <div className="mt-3 space-y-1 text-sm text-slate-600">
            {currentDoctor.specialty && <p>Specialty: {currentDoctor.specialty}</p>}
            {currentDoctor.email && <p>Email: {currentDoctor.email}</p>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className={uiTokens.primaryButton} onClick={handleNewScan}>
              New Scan
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleViewHistory}
            >
              View History
            </button>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        !currentDoctor &&
        availableDoctors &&
        availableDoctors.length > 0 && (
          <div className={`${uiTokens.card} p-5`}>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-slate-900">Select a Doctor</h2>
              <p className="text-sm text-slate-600">
                Choose a dermatologist to link with your account.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {availableDoctors.map((doctor) => {
                const id = doctor.id ?? doctor.doctor_id;

                return (
                  <div
                    key={id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-base font-semibold text-slate-900">
                      {doctor.full_name ?? 'Doctor'}
                    </p>
                    {doctor.specialty && (
                      <p className="text-sm text-slate-600">Specialty: {doctor.specialty}</p>
                    )}
                    <div className="mt-3">
                      <button
                        onClick={() => handleSelectDoctor(doctor)}
                        disabled={selectingDoctorId === id}
                        className={uiTokens.primaryButton}
                      >
                        {selectingDoctorId === id ? 'Selecting...' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {!loading &&
        !error &&
        !currentDoctor &&
        (!availableDoctors || availableDoctors.length === 0) && (
          <p className="text-sm text-slate-600">
            No available doctors found yet. Please check back later.
          </p>
        )}
    </div>
  );
}

export default PatientDashboard;
