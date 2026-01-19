import React from 'react';
import { Link } from 'react-router-dom';
import { uiTokens } from '../components/Layout';

const AboutPage = () => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          About DermaAI
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Pioneering AI-powered teledermatology to make expert skin care accessible to everyone.
        </p>
      </section>

      {/* Mission Section */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 p-8 sm:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
          <p className="mt-4 text-lg text-slate-700">
            To bridge the gap between patients and dermatology specialists by combining 
            cutting-edge AI technology with the expertise of board-certified dermatologists, 
            making quality skin care accessible regardless of geographic location.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Our Story</h2>
          <div className="mt-4 space-y-4 text-slate-600">
            <p>
              DermaAI was founded with a simple observation: millions of people delay seeking 
              dermatological care due to long wait times, geographic barriers, or uncertainty 
              about whether their skin condition warrants professional attention.
            </p>
            <p>
              By leveraging Google's Gemini AI technology, we created a platform that provides 
              instant preliminary analysis of skin conditions, helping patients understand their 
              concerns while connecting them directly with qualified dermatologists for 
              authoritative medical guidance.
            </p>
            <p>
              Our network of partner clinics brings together specialized dermatologists who 
              share our vision of technology-enhanced, patient-centered care.
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">4 Partner Clinics</p>
                <p className="text-sm text-slate-600">Specialized dermatology centers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Board-Certified</p>
                <p className="text-sm text-slate-600">All doctors fully credentialed</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Instant AI Analysis</p>
                <p className="text-sm text-slate-600">Powered by Google Gemini</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-center text-2xl font-bold text-slate-900">How It Works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Upload Your Image',
              description: 'Take a clear photo of your skin concern and upload it securely to our platform.',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ),
            },
            {
              step: '2',
              title: 'AI Analysis',
              description: 'Our AI provides instant preliminary insights about potential conditions.',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              ),
            },
            {
              step: '3',
              title: 'Doctor Review',
              description: 'A board-certified dermatologist reviews your case and provides medical guidance.',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              ),
            },
          ].map((item) => (
            <div key={item.step} className={`${uiTokens.card} p-6 text-center`}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
              </div>
              <div className="mt-4">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="rounded-2xl bg-slate-900 p-8 text-white sm:p-12">
        <h2 className="text-center text-2xl font-bold">Our Values</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { title: 'Patient First', description: 'Your health and privacy are our top priorities.' },
            { title: 'Expert Care', description: 'Only board-certified dermatologists review cases.' },
            { title: 'Transparency', description: 'AI assists but never replaces professional judgment.' },
          ].map((value) => (
            <div key={value.title} className="text-center">
              <h3 className="font-semibold text-emerald-400">{value.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-800">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Important Medical Disclaimer
        </h2>
        <div className="mt-3 space-y-2 text-sm text-amber-900">
          <p>
            <strong>This application is a Proof of Concept (POC) for educational purposes ONLY.</strong>
          </p>
          <p>
            DermaAI is NOT a substitute for professional medical advice, diagnosis, or treatment. 
            The AI analysis provides preliminary educational information only and should never be 
            used as the basis for medical decisions.
          </p>
          <p>
            Always consult with a qualified healthcare professional for any medical concerns. 
            If you have a medical emergency, please call emergency services immediately.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Ready to Get Started?</h2>
        <p className="mt-2 text-slate-600">
          Connect with our network of dermatology specialists today.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/login?mode=signup"
            className={`${uiTokens.primaryButton} h-12 rounded-full px-8`}
          >
            Create Account
          </Link>
          <Link
            to="/doctors"
            className="h-12 rounded-full border border-slate-200 bg-white px-8 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 flex items-center"
          >
            Meet Our Doctors
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
