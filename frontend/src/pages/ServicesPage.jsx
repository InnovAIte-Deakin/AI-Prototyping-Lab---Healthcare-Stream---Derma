import React from 'react';
import { Link } from 'react-router-dom';
import { uiTokens } from '../components/Layout';

const ServicesPage = () => {
  const services = [
    {
      title: 'AI-Powered Skin Analysis',
      description:
        'Upload photos of your skin concern and receive instant preliminary insights powered by Google Gemini AI. Our technology analyzes patterns and provides educational information about potential conditions.',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      ),
      color: 'blue',
      features: [
        'Instant analysis within seconds',
        'Powered by advanced AI technology',
        'Educational insights about conditions',
        'Privacy-first image handling',
      ],
    },
    {
      title: 'Expert Dermatologist Consultation',
      description:
        'Connect with board-certified dermatologists who review your case and provide professional medical guidance. Our specialists have years of experience in diagnosing and treating skin conditions.',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      ),
      color: 'emerald',
      features: [
        '100% board-certified specialists',
        'Personalized medical assessment',
        'Treatment recommendations',
        'Follow-up care planning',
      ],
    },
    {
      title: 'Secure Messaging',
      description:
        'Communicate directly with your assigned dermatologist through our secure, HIPAA-aligned messaging platform. Ask questions, share updates, and receive ongoing guidance.',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      ),
      color: 'purple',
      features: [
        'Real-time messaging',
        'End-to-end encryption',
        'File and image sharing',
        'Message history preservation',
      ],
    },
    {
      title: 'Case Management & Tracking',
      description:
        'Keep track of all your skin health cases in one convenient dashboard. Monitor your history, review past analyses, and track the progress of your consultations.',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      ),
      color: 'amber',
      features: [
        'Complete case history',
        'Progress tracking',
        'Document organization',
        'Easy case reference',
      ],
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700',
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      badge: 'bg-purple-50 text-purple-700',
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700',
    },
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Our Services</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Comprehensive teledermatology services combining AI technology with expert medical care
          to provide you with accessible, quality skin health solutions.
        </p>
      </section>

      {/* Services Grid */}
      <section className="space-y-8">
        {services.map((service, index) => (
          <div
            key={service.title}
            className={`${uiTokens.card} overflow-hidden ${
              index % 2 === 1 ? 'md:flex-row-reverse' : ''
            } md:flex`}
          >
            {/* Icon Section */}
            <div
              className={`flex items-center justify-center p-8 md:w-1/3 ${
                colorClasses[service.color].bg
              }`}
            >
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg ${
                  colorClasses[service.color].text
                }`}
              >
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {service.icon}
                </svg>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:w-2/3 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900">{service.title}</h2>
              <p className="mt-3 text-slate-600">{service.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      colorClasses[service.color].badge
                    }`}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Pricing Section */}
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white sm:p-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-emerald-300">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Currently Free During Beta</span>
          </div>
          <p className="mt-4 text-slate-300">
            As a Proof of Concept, all services are currently available at no cost.
            <br />
            Experience the full platform while we refine our offerings.
          </p>
        </div>
      </section>

      {/* Process Overview */}
      <section>
        <h2 className="text-center text-2xl font-bold text-slate-900">How It Works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { step: '1', title: 'Create Account', desc: 'Sign up and choose your doctor' },
            { step: '2', title: 'Upload Image', desc: 'Take a photo of your skin concern' },
            { step: '3', title: 'AI Analysis', desc: 'Receive instant preliminary insights' },
            { step: '4', title: 'Doctor Review', desc: 'Get professional medical guidance' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                {item.step}
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-800">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Service Disclaimer
        </h2>
        <p className="mt-3 text-sm text-amber-900">
          DermaAI is a Proof of Concept for educational purposes only. The AI analysis provides
          preliminary educational information and is NOT a substitute for professional medical
          diagnosis. Always consult with a qualified healthcare provider for medical concerns.
        </p>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Ready to Get Started?</h2>
        <p className="mt-2 text-slate-600">
          Experience AI-powered dermatology care today.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link to="/login?mode=signup" className={`${uiTokens.primaryButton} h-12 rounded-full px-8`}>
            Create Free Account
          </Link>
          <Link
            to="/try-anonymous"
            className="flex h-12 items-center rounded-full border border-slate-200 bg-white px-8 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Try Without Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
