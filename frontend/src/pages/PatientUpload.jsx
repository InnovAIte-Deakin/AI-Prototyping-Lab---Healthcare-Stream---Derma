import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';
import UnifiedChat from '../components/UnifiedChat';
import { useToast } from '../context/ToastContext';

const PatientUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('none');
  const { pushToast } = useToast();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
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
      const detail = err.response?.data?.detail || 'Something went wrong.';
      setError(`Analysis failed: ${detail}`);
      pushToast({
        title: 'Analysis failed',
        message: detail,
      });
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
      pushToast({
        title: 'Review request failed',
        message: detail || 'Failed to request doctor review.',
      });
    } finally {
      setIsRequestingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Patient Upload</h1>
          <p className="text-sm text-slate-500">
            Upload a clear photo of the affected skin area to generate an AI-assisted report.
          </p>
        </div>
        <Link
          to="/patient-dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          ← Back to dashboard
        </Link>
      </div>

      <DisclaimerBanner />

      <div className={`${uiTokens.card} p-5 space-y-4`}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="upload-input">
            Upload image
          </label>
          <input
            id="upload-input"
            type="file"
            accept="image/*"
            aria-label="Upload image"
            onChange={handleFileChange}
            className={uiTokens.input}
          />
          <p className="text-xs text-slate-500">
            Supported formats: JPG, PNG. Ensure good lighting and focus on the lesion.
          </p>
        </div>

        <button
          type="button"
          className={uiTokens.primaryButton}
          disabled={!selectedFile || isAnalyzing}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </p>
        )}

        {result && result.report_id && (
          <div className="space-y-4">
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
                  pushToast({
                    title: 'Status refresh failed',
                    message: 'Could not refresh the review status. Please try again.',
                  });
                }
              }}
            />

            {reviewStatus === 'none' && result.report_id && (
              <div className={`${uiTokens.card} p-4 bg-purple-50 border-purple-100`}>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div>
                    <h3 className="text-purple-900 font-bold">Unsure about the AI's assessment?</h3>
                    <p className="text-purple-700 text-sm">Escalate this case to a human dermatologist for a professional review.</p>
                  </div>
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-purple-700 transition-all hover:scale-105 disabled:opacity-50"
                    disabled={isRequestingReview}
                    onClick={handleRequestReview}
                  >
                    {isRequestingReview ? 'Requesting...' : '📨 Request Physician Review'}
                  </button>
                </div>
              </div>
            )}

            {reviewStatus === 'pending' && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4 text-center">
                <p className="text-yellow-800 text-sm font-bold uppercase tracking-widest">
                  ⏳ Review Pending - A physician will be with you shortly
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientUpload;
