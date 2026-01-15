import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import { uiTokens } from '../components/Layout';

// Doctor Card Component
const DoctorCard = ({ doctor, onSelect, isSelecting }) => {
  const id = doctor.id ?? doctor.doctor_id;

  return (
    <div className={`${uiTokens.card} p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
      <div className="flex gap-5">
        {/* Avatar */}
        {doctor.avatar_url ? (
          <img
            src={doctor.avatar_url}
            alt={doctor.full_name ?? 'Doctor'}
            className="h-20 w-20 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {doctor.full_name ?? 'Doctor'}
              </h3>
              {doctor.clinic_name && (
                <p className="text-sm text-slate-500 mt-0.5">{doctor.clinic_name}</p>
              )}
            </div>
            <span className={uiTokens.badgeSuccess}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Available
            </span>
          </div>

          {doctor.bio && (
            <p className="mt-3 text-sm text-slate-600 line-clamp-2">{doctor.bio}</p>
          )}

          {doctor.email && (
            <a
              href={`mailto:${doctor.email}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {doctor.email}
            </a>
          )}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100">
        <button
          onClick={() => onSelect(doctor)}
          disabled={isSelecting === id}
          className={`${uiTokens.primaryButton} w-full`}
        >
          {isSelecting === id ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Selecting...
            </span>
          ) : (
            'Select This Doctor'
          )}
        </button>
      </div>
    </div>
  );
};

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
        const myDoctorRes = await apiClient.get('/patient/my-doctor');
        setCurrentDoctor(myDoctorRes.data.doctor);
      } catch (err) {
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

      setCurrentDoctor(doctor);
      setAvailableDoctors([]);
    } catch (err) {
      console.error(err);
      setError('Failed to select doctor. Please try again.');
    } finally {
      setSelectingDoctorId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Patient Dashboard</h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Manage your dermatologist connection and track your skin health journey
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/patient-upload')} className={uiTokens.primaryButton}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Scan
          </button>
          <button onClick={() => navigate('/patient-history')} className={uiTokens.secondaryButton}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View History
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={`${uiTokens.card} p-12 flex flex-col items-center justify-center`}>
          <div className="h-10 w-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-600">Loading your dashboard...</p>
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

      {/* Current Doctor Section */}
      {!loading && !error && currentDoctor && (
        <div className={`${uiTokens.card} p-6 sm:p-8`}>
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Avatar */}
            {currentDoctor.avatar_url ? (
              <img
                src={currentDoctor.avatar_url}
                alt={currentDoctor.full_name ?? 'Doctor'}
                className="h-24 w-24 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0">
                <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">Your Dermatologist</p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {currentDoctor.full_name ?? 'Unknown'}
                  </h2>
                </div>
                <span className={uiTokens.badgeSuccess}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
                  Active
                </span>
              </div>

              {currentDoctor.clinic_name && (
                <p className="mt-2 text-slate-600">
                  <span className="font-medium">Clinic:</span> {currentDoctor.clinic_name}
                </p>
              )}

              {currentDoctor.bio && (
                <p className="mt-4 text-slate-600 leading-relaxed">{currentDoctor.bio}</p>
              )}

              {currentDoctor.email && (
                <a
                  href={`mailto:${currentDoctor.email}`}
                  className="mt-4 inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors font-medium"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {currentDoctor.email}
                </a>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            <button onClick={() => navigate('/patient-upload')} className={uiTokens.primaryButton}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload New Scan
            </button>
            <button onClick={() => navigate('/patient-history')} className={uiTokens.secondaryButton}>
              View Scan History
            </button>
          </div>
        </div>
      )}

      {/* Doctor Selection Section */}
      {!loading && !error && !currentDoctor && availableDoctors && availableDoctors.length > 0 && (
        <div className="space-y-6">
          <div className={`${uiTokens.card} p-6`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex-shrink-0">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Choose Your Dermatologist</h2>
                <p className="mt-1 text-slate-600">
                  Select a board-certified dermatologist to connect with your account for personalized care.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {availableDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id ?? doctor.doctor_id}
                doctor={doctor}
                onSelect={handleSelectDoctor}
                isSelecting={selectingDoctorId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !currentDoctor && (!availableDoctors || availableDoctors.length === 0) && (
        <div className={`${uiTokens.card} p-12 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No doctors available</h3>
          <p className="mt-2 text-slate-500">Please check back later for available dermatologists.</p>
        </div>
      )}
    </div>
  );
}

export default PatientDashboard;
