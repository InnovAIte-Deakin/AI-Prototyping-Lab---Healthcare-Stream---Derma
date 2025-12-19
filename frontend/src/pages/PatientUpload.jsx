import React, { useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';

const PatientUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('none');
  const [doctorActive, setDoctorActive] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  // Fetch current doctor on mount
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await apiClient.get('/patient/my-doctor');
        setCurrentDoctor(res.data?.doctor || res.data);
      } catch (err) {
        console.error('No doctor linked:', err);
      } finally {
        setLoadingDoctor(false);
      }
    };
    fetchDoctor();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    // Reset results when new file selected
    setResult(null);
    setReportId(null);
    setReviewStatus('none');
    setDoctorActive(false);
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
      formData.append('image', selectedFile);

      // Upload image (now requires linked doctor)
      const uploadRes = await apiClient.post('/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageId = uploadRes.data?.image_id ?? uploadRes.data?.id;

      if (!imageId) {
        throw new Error('Image ID missing from upload response');
      }

      // Trigger AI analysis
      const analyzeRes = await apiClient.post(`/api/analysis/${imageId}`);
      setResult(analyzeRes.data);

      // Use report_id from analysis response
      if (analyzeRes.data?.report_id) {
        setReportId(analyzeRes.data.report_id);
        setReviewStatus(analyzeRes.data.review_status || 'none');
        setDoctorActive(analyzeRes.data.doctor_active || false);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const detail = err?.response?.data?.detail;
      setError(detail || 'Something went wrong while analyzing the image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestReview = async () => {
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

  // Render status badge
  const renderStatusBadge = () => {
    const badges = {
      none: null,
      pending: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          ⏳ Review Pending
        </span>
      ),
      accepted: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          👨‍⚕️ Doctor Reviewing
        </span>
      ),
      reviewed: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          ✅ Doctor Responded
        </span>
      ),
    };
    return badges[reviewStatus] || null;
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Patient Upload</h1>

      {/* Doctor Info */}
      {loadingDoctor ? (
        <p className="text-gray-500">Loading doctor info...</p>
      ) : currentDoctor ? (
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm text-gray-600">Your Doctor</p>
          <p className="font-medium">{currentDoctor.full_name || currentDoctor.name || 'Unknown'}</p>
          {currentDoctor.clinic_name && (
            <p className="text-sm text-gray-500">{currentDoctor.clinic_name}</p>
          )}
        </div>
      ) : (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-yellow-800">
            ⚠️ You must select a doctor before uploading images.{' '}
            <a href="/patient-dashboard" className="underline">Go to dashboard</a>
          </p>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block"
        />
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={!selectedFile || isAnalyzing || !currentDoctor}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>

        {error && <p className="text-red-600">{error}</p>}

        {/* Analysis Result */}
        {result && (
          <div className="rounded border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Analysis Result</h2>
              {renderStatusBadge()}
            </div>

            {/* Doctor active notification */}
            {doctorActive && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-blue-800 font-medium">
                  👨‍⚕️ Your doctor is reviewing this case. AI responses are paused.
                </p>
              </div>
            )}

            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">
              {typeof result.analysis === 'string'
                ? result.analysis
                : JSON.stringify(result, null, 2)}
            </pre>

            {/* Request Review Button */}
            {reviewStatus === 'none' && reportId && (
              <button
                type="button"
                className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                disabled={isRequestingReview}
                onClick={handleRequestReview}
              >
                {isRequestingReview ? 'Requesting...' : '📨 Request Doctor Review'}
              </button>
            )}

            {/* View Chat Link */}
            {(reviewStatus === 'accepted' || reviewStatus === 'reviewed') && reportId && (
              <a
                href={`/patient-chat/${reportId}`}
                className="inline-block rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                💬 View Doctor Messages
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientUpload;

