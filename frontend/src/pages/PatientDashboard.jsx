import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';
import ChangeDoctorModal from '../components/ChangeDoctorModal';

function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectingDoctorId, setSelectingDoctorId] = useState(null);
  const [showChangeDoctorModal, setShowChangeDoctorModal] = useState(false);

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

  const handleDoctorChangeSuccess = (data) => {
    // data contains: { doctor, status, previous_doctor_id }
    setCurrentDoctor(data.doctor);
    setShowChangeDoctorModal(false);
    setError(null);
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
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '0.5rem',
          }}
        >
          <h2>Your Doctor</h2>
          <p><strong>Name:</strong> {currentDoctor.doctor?.full_name || currentDoctor.full_name || currentDoctor.name || 'Unknown'}</p>
          <p>
            <strong>Clinic:</strong>{' '}
            {currentDoctor.doctor?.clinic_name || currentDoctor.clinic_name || 'Clinic unavailable'}
          </p>
          {(currentDoctor.doctor?.bio || currentDoctor.bio) && (
            <p><strong>Bio:</strong> {currentDoctor.doctor?.bio || currentDoctor.bio}</p>
          )}
          {(currentDoctor.doctor?.email || currentDoctor.email) && (
            <p><strong>Email:</strong> {currentDoctor.doctor?.email || currentDoctor.email}</p>
          )}

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
            <button
              className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              onClick={() => setShowChangeDoctorModal(true)}
            >
              Change Doctor
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
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                    }}
                  >
                    <p><strong>{doctor.full_name || doctor.name || 'Doctor'}</strong></p>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                      {doctor.clinic_name || 'Clinic unavailable'}
                    </p>
                    {doctor.bio && (
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{doctor.bio}</p>
                    )}
                    <button
                      onClick={() => handleSelectDoctor(doctor)}
                      disabled={selectingDoctorId === id}
                      style={{ marginTop: '0.5rem' }}
                    >
                      {selectingDoctorId === id ? 'Selecting…' : 'Select'}
                    </button>
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

      {/* Change Doctor Modal */}
      {showChangeDoctorModal && (
        <ChangeDoctorModal
          currentDoctor={currentDoctor}
          onClose={() => setShowChangeDoctorModal(false)}
          onSuccess={handleDoctorChangeSuccess}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}

export default PatientDashboard;
