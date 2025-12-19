import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';

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
        setCurrentDoctor(myDoctorRes.data);
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
    <div style={{ padding: '1.5rem' }}>
      {/* 👇 This heading text is important for the tests */}
      <h1>Patient Dashboard</h1>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>
      )}

      {/* If the patient already has a doctor */}
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

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleNewScan}>New Scan</button>
            <button onClick={handleViewHistory}>View History</button>
          </div>
        </div>
      )}

      {/* If no doctor yet: show list to pick from */}
      {!loading &&
        !error &&
        !currentDoctor &&
        availableDoctors &&
        availableDoctors.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h2>Select a Doctor</h2>
            <p>Please choose a doctor to link with your account.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
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

      {/* If we tried to load doctors but got none */}
      {!loading &&
        !error &&
        !currentDoctor &&
        (!availableDoctors || availableDoctors.length === 0) && (
          <p style={{ marginTop: '1rem' }}>
            No available doctors found yet. Please check back later.
          </p>
        )}
    </div>
  );
}

export default PatientDashboard;
