import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';
import UnifiedChat from '../components/UnifiedChat';

const PatientUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('none');

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image to upload.');
      return;
    }

    setError(null);
    setResult(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await apiClient.post('/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageId = uploadRes.data?.image_id ?? uploadRes.data?.id;

      if (!imageId) {
        throw new Error('Image ID missing');
      }

      const analyzeRes = await apiClient.post(`/api/analysis/${imageId}`);
      setResult(analyzeRes.data);
      if (analyzeRes.data?.report_id) {
        setReviewStatus(analyzeRes.data.review_status || 'none');
      }
    } catch (err) {
      console.error('Analysis Error:', err.response?.data || err.message);
      setError(`Analysis failed: ${err.response?.data?.detail || 'Something went wrong.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestReview = async () => {
    const reportId = result?.report_id;
    if (!reportId) {
      setError('No analysis to request review for.');
      return;
    }

    setIsRequestingReview(true);
    setError(null);

    try {
      const res = await apiClient.post(`/cases/${reportId}/request-review`);
      setReviewStatus(res.data.review_status);
    } catch (err) {
      console.error('Request review error:', err);
      const detail = err?.response?.data?.detail;
      setError(detail || 'Failed to request doctor review.');
    } finally {
      setIsRequestingReview(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Skin Image</h1>
          <p className="mt-1 text-[15px] text-slate-500">
            Upload a clear photo of the affected area for AI-powered analysis
          </p>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Upload Card */}
      <div className={`${uiTokens.card} p-6 sm:p-8`}>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Select Image
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
                      className="w-full h-64 object-contain rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="mt-3 text-sm text-slate-500 hover:text-red-500 transition-colors"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-64 cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 mb-4">
                        <svg className="h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                    <input
                      id="upload-input"
                      type="file"
                      accept="image/*"
                      aria-label="Upload image"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Tips for best results</h4>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Use good lighting (natural light works best)
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Focus directly on the affected area
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Avoid blurry or distant shots
                </li>
              </ul>
            </div>

            {/* Analyze Button */}
            <button
              type="button"
              className={`${uiTokens.primaryButton} w-full py-3.5 text-base`}
              disabled={!selectedFile || isAnalyzing}
              onClick={handleAnalyze}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing Image...
                </span>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                  Analyze Image
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {!result && !isAnalyzing && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                <div className="text-center p-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">No analysis yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Upload an image and click Analyze to see AI insights
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="text-center p-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mb-4">
                    <svg className="h-8 w-8 text-teal-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">Analyzing your image...</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Our AI is examining the skin characteristics
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results & Chat Section */}
      {result && result.report_id && (
        <div className="space-y-6">
          <UnifiedChat
            imageId={result.image_id}
            reportId={result.report_id}
            isPaused={reviewStatus === 'accepted'}
            userRole="patient"
            onStatusChange={async () => {
              try {
                const res = await apiClient.get(`/api/analysis/report/${result.report_id}`);
                if (res.data?.review_status) {
                  setReviewStatus(res.data.review_status);
                }
              } catch (err) {
                console.error('Failed to refresh status:', err);
              }
            }}
          />

          {/* Request Review CTA */}
          {reviewStatus === 'none' && result.report_id && (
            <div className={`${uiTokens.card} p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/60`}>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 flex-shrink-0">
                    <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-violet-900">Want a professional opinion?</h3>
                    <p className="text-sm text-violet-700 mt-0.5">
                      Request a review from a board-certified dermatologist
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${uiTokens.accentButton} whitespace-nowrap`}
                  disabled={isRequestingReview}
                  onClick={handleRequestReview}
                >
                  {isRequestingReview ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Requesting...
                    </span>
                  ) : (
                    'Request Physician Review'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Pending Status */}
          {reviewStatus === 'pending' && (
            <div className={`${uiTokens.card} p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200/60 text-center`}>
              <div className="flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 pulse-dot" />
                <p className="font-semibold text-amber-800">
                  Review Pending - A physician will be with you shortly
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientUpload;
