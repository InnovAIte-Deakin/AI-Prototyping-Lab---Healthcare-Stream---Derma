import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DisclaimerBanner from "../components/DisclaimerBanner";
import { uiTokens } from "../components/Layout";
import { publicApiClient } from "../utils/publicClient";

function PublicTryPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    setError(null);
    if (nextFile) {
      const url = URL.createObjectURL(nextFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please choose an image to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setChatMessages([]);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await publicApiClient.post("/public/try/analyze", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      setSessionId(data.session_id);
      setAnalysis(data);
      setChatMessages([
        {
          role: "ai",
          text: `Quick take: ${data.condition || "analysis unavailable"}. Confidence: ${Math.round(data.confidence || 0)}%`,
        },
        {
          role: "ai",
          text: "Ask a follow-up question to preview the chat experience. Your session stays private and is not saved.",
        },
      ]);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      setError(detail || "Preview analysis failed. Please try again in a moment.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async (event) => {
    event.preventDefault();
    if (!sessionId) {
      setError("Run an analysis first to start the preview chat.");
      return;
    }
    if (!chatInput.trim()) return;

    const message = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "you", text: message }]);
    setIsChatting(true);

    try {
      const res = await publicApiClient.post("/public/try/chat", {
        session_id: sessionId,
        message,
      });

      setChatMessages((prev) => [...prev, { role: "ai", text: res.data.reply }]);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Chat preview is unavailable right now.");
    } finally {
      setIsChatting(false);
    }
  };

  const showResult = Boolean(analysis);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className={uiTokens.badgeInfo}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Anonymous Preview
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Try SkinScope</h1>
          <p className="mt-2 text-[15px] text-slate-500 max-w-2xl">
            Upload a photo to see how our AI analyzes skin conditions. Nothing is saved until you create an account.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <svg className="h-3 w-3 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              No login required
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <svg className="h-3 w-3 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Preview only
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <svg className="h-3 w-3 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Not saved
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/login?mode=signup")}
          className={uiTokens.primaryButton}
        >
          Sign up for full access
        </button>
      </div>

      <DisclaimerBanner />

      {/* Main Content */}
      <div className={`${uiTokens.card} p-6 sm:p-8`}>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Upload an image
              </label>

              {/* Drop Zone */}
              <div className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
                previewUrl
                  ? 'border-teal-300 bg-teal-50/50'
                  : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}>
                {previewUrl ? (
                  <div className="p-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="mt-3 text-sm text-slate-500 hover:text-red-500 transition-colors"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 mb-3">
                        <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-700">Click to upload</p>
                      <p className="mt-1 text-xs text-slate-400">JPG, PNG up to 10MB</p>
                    </div>
                    <input
                      id="anon-upload"
                      type="file"
                      accept="image/*"
                      aria-label="Upload an image"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Your image is discarded after this preview session.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !file}
                className={`${uiTokens.primaryButton} flex-1`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Run Quick Analysis'
                )}
              </button>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Have an account? Log in
              </Link>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* How it Works */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">How this preview works</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                We analyze once and keep the result in memory only.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                Chat is short-lived; sessions expire after a few minutes.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                Nothing is stored to your account without signing up.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {showResult && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Analysis Result */}
          <div className={`${uiTokens.card} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <span className={uiTokens.badgeInfo}>AI Preview Result</span>
              <span className={analysis.status === "error" ? uiTokens.badgeWarning : uiTokens.badgeNeutral}>
                {analysis.status === "error" ? "Service issue" : "Preview"}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{analysis.condition}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {analysis.recommendation}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Confidence</p>
                <p className="text-lg font-bold text-slate-900">{Math.round(analysis.confidence || 0)}%</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Severity</p>
                <p className="text-lg font-bold text-slate-900">{analysis.severity}</p>
              </div>
            </div>

            {analysis.characteristics?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-400 uppercase mb-2">Characteristics</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.characteristics.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 pt-3 border-t border-slate-100">{analysis.disclaimer}</p>
          </div>

          {/* Chat Preview */}
          <div className={`${uiTokens.card} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Chat Preview</p>
              <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                Limited
              </span>
            </div>

            <div className="h-56 overflow-y-auto space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Ask a question to see how the AI responds.</p>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={`${m.role}-${idx}`} className={m.role === "ai" ? "" : "text-right"}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      {m.role === "ai" ? "SkinScope AI" : "You"}
                    </p>
                    <div className={`inline-block rounded-xl px-4 py-2 text-sm ${
                      m.role === "ai"
                        ? "bg-white border border-slate-200 text-slate-700"
                        : "bg-slate-900 text-white"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!sessionId || isChatting}
                placeholder={sessionId ? "Ask a quick question" : "Run an analysis first"}
                className={`${uiTokens.input} flex-1`}
              />
              <button
                type="submit"
                disabled={!sessionId || isChatting || !chatInput.trim()}
                className={uiTokens.primaryButton}
              >
                {isChatting ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up CTA */}
      {showResult && (
        <div className={`${uiTokens.card} p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/60`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-1">Save your progress</p>
              <h3 className="text-xl font-bold text-slate-900">Sign up to save this case</h3>
              <p className="text-sm text-slate-600 mt-1">
                Create a free account to store images, request doctor reviews, and continue conversations.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                to={sessionId ? `/login?mode=signup&public_session_id=${sessionId}` : "/login?mode=signup"}
                className={uiTokens.accentButton}
              >
                Sign up to save
              </Link>
              <Link
                to="/login"
                className={uiTokens.secondaryButton}
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicTryPage;
