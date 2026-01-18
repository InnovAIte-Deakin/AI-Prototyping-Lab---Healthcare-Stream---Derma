import { useNavigate, Link } from 'react-router-dom';
import { uiTokens } from '../components/Layout';

const accent = 'from-[#e7f7f4] via-white to-[#f7ecf7]';
const heroTitleAccent = 'text-[#4c7dff]';

function LandingPage() {
  const navigate = useNavigate();

  const partnerClinics = [
    { name: 'Melbourne Skin Centre', location: 'Melbourne, VIC' },
    { name: 'Sydney Dermatology Institute', location: 'Sydney, NSW' },
    { name: 'Brisbane Skin Specialists', location: 'Brisbane, QLD' },
    { name: 'Perth Dermcare Clinic', location: 'Perth, WA' },
  ];

  const testimonials = [
    {
      quote: 'The AI analysis was incredibly accurate and the doctor review gave me peace of mind. Highly recommend!',
      author: 'Sarah M.',
      role: 'Patient',
    },
    {
      quote: 'As a busy professional, having access to dermatology care from home has been a game-changer.',
      author: 'James K.',
      role: 'Patient',
    },
    {
      quote: 'The platform is intuitive and the doctors are very responsive. Great experience overall.',
      author: 'Emily R.',
      role: 'Patient',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6 py-16">
        <div
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${accent}`}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-6 top-12 h-72 w-72 rounded-full bg-teal-200/25 blur-[120px]" />
          <div className="absolute right-8 bottom-12 h-72 w-72 rounded-full bg-pink-200/30 blur-[120px]" />
        </div>

        <div className="space-y-8 text-center">
          <p className="inline-flex rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur">
            DermaAI Platform
          </p>
          <h1 className="mx-auto max-w-4xl text-5xl font-black leading-tight text-slate-900 sm:text-7xl">
            Identify skin concerns{' '}
            <span className={heroTitleAccent}>instantly</span> with AI
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[#333]">
            Connect with board-certified dermatologists at our partner clinics.
            Upload images for instant AI analysis, track your journey, and receive
            expert medical guidance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/login?mode=signup')}
              className={`${uiTokens.primaryButton} h-12 rounded-full px-8 text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 bg-gradient-to-r from-[#4c7dff] to-[#5f8dff]`}
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="h-12 rounded-full border border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/try-anonymous')}
              className="h-12 rounded-full border border-indigo-100 bg-indigo-50 px-8 text-base font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            >
              Try without signing up
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-bold text-slate-900">How It Works</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
          Get expert dermatology care in three simple steps
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Upload Your Photo',
              description:
                'Take a clear photo of your skin concern and securely upload it to our platform.',
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              ),
            },
            {
              step: '2',
              title: 'AI Analysis',
              description:
                'Our AI provides instant preliminary insights powered by Google Gemini technology.',
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              ),
            },
            {
              step: '3',
              title: 'Doctor Review',
              description:
                'A board-certified dermatologist reviews your case and provides medical guidance.',
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              ),
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Clinics */}
      <section className="rounded-2xl bg-slate-900 mx-4 p-8 text-white sm:p-12">
        <h2 className="text-center text-3xl font-bold">Our Partner Clinics</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-300">
          Trusted dermatology centers across Australia (fictional for POC)
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {partnerClinics.map((clinic) => (
            <div
              key={clinic.name}
              className="rounded-xl bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/15"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold">{clinic.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{clinic.location}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:underline"
          >
            Meet our dermatologists
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Trusted by Patients
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
          See what our users are saying (fictional testimonials for POC)
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`${uiTokens.card} p-6`}
            >
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-600">"{testimonial.quote}"</p>
              <div className="mt-4">
                <p className="font-medium text-slate-900">{testimonial.author}</p>
                <p className="text-xs text-slate-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-4 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 p-8 text-center text-white sm:p-12">
        <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
        <p className="mx-auto mt-3 max-w-xl text-blue-100">
          Join thousands of patients who trust DermaAI for their dermatology care.
          Create your free account today.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/login?mode=signup')}
            className="h-12 rounded-full bg-white px-8 text-base font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
          >
            Create Free Account
          </button>
          <Link
            to="/services"
            className="h-12 flex items-center rounded-full border-2 border-white/40 px-8 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-2xl px-4 text-center">
        <p className="text-xs text-slate-500">
          <strong>Important:</strong> DermaAI is a Proof of Concept for educational purposes only.
          It is NOT a substitute for professional medical advice. All doctors, clinics, and
          testimonials shown are fictional. For real medical concerns, please consult a licensed
          healthcare provider.
        </p>
      </section>
    </div>
  );
}

export default LandingPage;
