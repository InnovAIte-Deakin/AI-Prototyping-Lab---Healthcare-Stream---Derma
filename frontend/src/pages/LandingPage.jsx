import { useNavigate } from 'react-router-dom';
import { uiTokens } from '../components/Layout';

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="group relative rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/60 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white">
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
      {icon}
    </div>
    <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
    <p className="text-sm leading-relaxed text-slate-600">{description}</p>
  </div>
);

// Trust Badge Component
const TrustBadge = ({ icon, label }) => (
  <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 px-4 py-2 shadow-sm">
    <span className="text-teal-600">{icon}</span>
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </div>
);

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative -mt-8">
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Gradient Orbs */}
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-teal-400/20 blur-[120px]" />
        <div className="absolute -right-32 top-32 h-[400px] w-[400px] rounded-full bg-violet-400/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-[100px]" />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 py-20 text-center">
        {/* Floating Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/60 px-4 py-2 shadow-sm animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-teal-500 pulse-dot" />
          <span className="text-sm font-semibold text-teal-700">AI-Powered Skin Analysis</span>
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl animate-slide-up">
          Expert dermatology insights,{' '}
          <span className="relative">
            <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              instantly accessible
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8.5C50 2.5 150 2.5 298 8.5" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
              <defs>
                <linearGradient id="underline-gradient" x1="0" y1="0" x2="300" y2="0">
                  <stop stopColor="#0d9488" stopOpacity="0.4"/>
                  <stop offset="0.5" stopColor="#14b8a6"/>
                  <stop offset="1" stopColor="#06b6d4" stopOpacity="0.4"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
          Upload a photo, receive AI-powered analysis, and connect with board-certified dermatologists
          for professional guidance when you need it.
        </p>

        {/* CTA Buttons */}
        <div className="mb-12 flex flex-col items-center gap-4 sm:flex-row animate-slide-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={() => navigate('/login?mode=signup')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-teal-600/30 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-600/40 hover:-translate-y-1"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Your Analysis
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className={`${uiTokens.secondaryButton} px-8 py-4 text-base`}
          >
            Sign In
          </button>

          <button
            onClick={() => navigate('/try-anonymous')}
            className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 px-8 py-4 text-base font-medium text-slate-600 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700"
          >
            Try Without Account
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <TrustBadge
            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            label="HIPAA Compliant"
          />
          <TrustBadge
            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            label="End-to-End Encrypted"
          />
          <TrustBadge
            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            label="Board-Certified Doctors"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-teal-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-700">
              How It Works
            </span>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Professional care, simplified
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Get expert dermatology insights in three simple steps
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              }
              title="Upload a Photo"
              description="Take a clear photo of the affected skin area. Our AI works best with well-lit, focused images."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              }
              title="AI Analysis"
              description="Our advanced AI analyzes your image instantly, identifying potential conditions with high accuracy."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              }
              title="Expert Consultation"
              description="Request a review from board-certified dermatologists for professional medical guidance."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-center shadow-2xl">
            {/* Background Pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
              <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-teal-400 blur-[100px]" />
              <div className="absolute -bottom-20 -right-20 h-[300px] w-[300px] rounded-full bg-violet-400 blur-[100px]" />
            </div>

            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Ready to take control of your skin health?
              </h2>
              <p className="mb-8 text-lg text-slate-300">
                Join thousands who trust SkinScope for AI-powered dermatology insights.
              </p>
              <button
                onClick={() => navigate('/login?mode=signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-200 hover:bg-slate-100 hover:-translate-y-0.5"
              >
                Create Free Account
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
