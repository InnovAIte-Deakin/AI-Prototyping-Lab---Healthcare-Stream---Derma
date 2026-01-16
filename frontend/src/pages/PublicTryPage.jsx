import React, { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import DisclaimerBanner from "../components/DisclaimerBanner";

import { uiTokens } from "../components/Layout";

import { publicApiClient } from "../utils/publicClient";



const infoPill = "inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700";



function PublicTryPage() {

  const navigate = useNavigate();

  const [file, setFile] = useState(null);

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

    <div className="space-y-8">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="space-y-2">

          <p className="text-sm font-semibold text-blue-700">Anonymous Preview</p>

          <h1 className="text-3xl font-bold text-slate-900">Try DermaAI without signing up</h1>

          <p className="text-slate-600 text-sm max-w-2xl">

            Upload a single photo to see how the AI summarizes a case. Nothing is saved until you create an account.

          </p>

          <div className="flex flex-wrap gap-2">

            <span className={infoPill}>No login required</span>

            <span className={infoPill}>Preview only  Not saved</span>

            <span className={infoPill}>Encourages signup after results</span>

          </div>

        </div>

        <button

          type="button"

          onClick={() => navigate("/login?mode=signup")}

          className={`${uiTokens.primaryButton} whitespace-nowrap`}

        >

          Sign up now

        </button>

      </div>



      <DisclaimerBanner />



      <div className={`${uiTokens.card} p-6 space-y-4`}>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">

          <div className="space-y-3">

            <label className="text-sm font-semibold text-slate-800" htmlFor="anon-upload">

              Upload an image

            </label>

            <input

              id="anon-upload"

              type="file"

              accept="image/*"
              aria-label="Upload an image"

              onChange={handleFileChange}

              className={uiTokens.input}

            />

            <p className="text-xs text-slate-500">We discard the image after this preview. Supported: JPG, PNG.</p>

            <div className="flex gap-3 flex-wrap">

              <button

                type="button"

                onClick={handleAnalyze}

                disabled={isAnalyzing}

                className={uiTokens.primaryButton}

              >

                {isAnalyzing ? "Analyzing..." : "Run quick analysis"}

              </button>

              <Link to="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800 self-center">

                Have an account? Log in

              </Link>

            </div>

            {error && (

              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">

                {error}

              </p>

            )}

          </div>



          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">

            <p className="font-semibold text-slate-800 mb-2">How this preview works</p>

            <ul className="list-disc pl-5 space-y-1">

              <li>We analyze once and keep the result in memory only.</li>

              <li>Chat is a short-lived preview; sessions expire after a few minutes.</li>

              <li>No authentication headers are sent, and nothing is stored to your account.</li>

            </ul>

          </div>

        </div>



        {showResult && (

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">

            <div className={`${uiTokens.card} border-blue-100 bg-white p-5 shadow-sm space-y-3`}>

              <div className="flex items-center justify-between">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">AI Preview Result</p>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-800">

                  {analysis.status === "error" ? "Service issue" : "Preview"}

                </span>

              </div>

              <h3 className="text-xl font-bold text-slate-900">{analysis.condition}</h3>

              <p className="text-sm text-slate-600 leading-relaxed">

                {analysis.recommendation}

              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">

                <div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase">Confidence</p>

                  <p className="font-black text-slate-900">{Math.round(analysis.confidence || 0)}%</p>

                </div>

                <div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase">Severity</p>

                  <p className="font-black text-slate-900">{analysis.severity}</p>

                </div>

              </div>

              {analysis.characteristics?.length > 0 && (

                <div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Visible characteristics</p>

                  <div className="flex flex-wrap gap-2">

                    {analysis.characteristics.map((item) => (

                      <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">

                        {item}

                      </span>

                    ))}

                  </div>

                </div>

              )}

              <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">{analysis.disclaimer}</p>

            </div>



            <div className={`${uiTokens.card} p-5 space-y-3 bg-white`}>

              <div className="flex items-center justify-between">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Chat Preview</p>

                <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">Limited</span>

              </div>

              <div className="h-56 overflow-y-auto space-y-3 bg-slate-50 border border-slate-100 rounded-lg p-3">

                {chatMessages.length === 0 ? (

                  <p className="text-sm text-slate-500">Ask a question to see how the AI responds.</p>

                ) : (

                  chatMessages.map((m, idx) => (

                    <div key={`${m.role}-${idx}`} className={m.role === "ai" ? "text-slate-800" : "text-slate-600 text-right"}>

                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{m.role === "ai" ? "DermaAI" : "You"}</p>

                      <div className={m.role === "ai" ? "rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm" : "inline-block rounded-xl bg-slate-900 text-white px-3 py-2"}>

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

                  {isChatting ? "..." : "Send"}

                </button>

              </form>

            </div>

          </div>

        )}

      </div>



      {showResult && (

        <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Save your progress</p>

            <h3 className="text-xl font-bold text-slate-900">Sign up to save this case and keep the chat history.</h3>

            <p className="text-sm text-slate-600">Create a free account to store images, request a doctor review, and continue the conversation later.</p>

          </div>

          <div className="flex gap-2">

            <Link to={sessionId ? `/login?mode=signup&public_session_id=${sessionId}` : "/login?mode=signup"} className={`${uiTokens.primaryButton} whitespace-nowrap`}>

              Sign up to save this case

            </Link>

            <Link to="/login" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300">

              Log in instead

            </Link>

          </div>

        </div>

      )}

    </div>

  );

}



export default PublicTryPage;

