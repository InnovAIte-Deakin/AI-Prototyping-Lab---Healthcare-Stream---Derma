import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { uiTokens } from '../components/Layout';
import { apiClient } from '../context/AuthContext';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await apiClient.get('/doctors');
        setDoctors(response.data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Unable to load doctor information at this time.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const defaultAvatar = (name) => {
    const initials = name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'DR';
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-500 text-2xl font-bold text-white">
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Meet Our Dermatologists
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Our network of board-certified dermatologists combines years of clinical experience
          with cutting-edge AI technology to provide you with the best possible care.
        </p>
      </section>

      {/* Credentials Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 p-6 text-white sm:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl font-bold">100%</div>
            <div className="mt-1 text-sm text-blue-100">Board Certified</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">15+ Years</div>
            <div className="mt-1 text-sm text-blue-100">Average Experience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">4</div>
            <div className="mt-1 text-sm text-blue-100">Partner Clinics</div>
          </div>
        </div>
      </section>

      {/* Doctor Cards */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">
          Our Specialist Team
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className={`${uiTokens.card} overflow-hidden transition-transform hover:scale-[1.02]`}
              >
                {/* Avatar */}
                <div className="h-48 w-full overflow-hidden">
                  {doctor.avatar_url ? (
                    <img
                      src={doctor.avatar_url}
                      alt={doctor.full_name || 'Doctor'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    defaultAvatar(doctor.full_name)
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {doctor.full_name || 'Name unavailable'}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {doctor.clinic_name || 'Clinic unavailable'}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {doctor.bio || 'Bio unavailable'}
                  </p>

                  {/* CTA */}
                  <Link
                    to="/login?mode=signup"
                    className="mt-4 block w-full rounded-lg bg-slate-100 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    Select This Doctor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="rounded-2xl bg-slate-50 p-8 sm:p-12">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Why Choose Our Network?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">Verified Credentials</h3>
            <p className="mt-2 text-sm text-slate-600">
              All our doctors are licensed and board-certified dermatologists.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">AI-Enhanced Care</h3>
            <p className="mt-2 text-sm text-slate-600">
              Our doctors leverage AI to provide faster, more accurate assessments.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">Direct Communication</h3>
            <p className="mt-2 text-sm text-slate-600">
              Chat directly with your doctor through our secure messaging platform.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Ready to Connect with a Specialist?
        </h2>
        <p className="mt-2 text-slate-600">
          Create your free account to get started.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/login?mode=signup"
            className={`${uiTokens.primaryButton} h-12 rounded-full px-8`}
          >
            Get Started
          </Link>
          <Link
            to="/try-anonymous"
            className="flex h-12 items-center rounded-full border border-slate-200 bg-white px-8 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Try Demo First
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DoctorsPage;
