import { useNavigate } from 'react-router-dom';
import { uiTokens } from '../components/Layout';

const accent = 'from-[#e7f7f4] via-white to-[#f7ecf7]';
const heroTitleAccent = 'text-[#4c7dff]';

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-6 py-16">
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
                    Connect with board-certified dermatologists at our partner clinics. Upload images for instant AI analysis, track your journey, and receive expert medical guidance.
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
        </div>
    );
}

export default LandingPage;
