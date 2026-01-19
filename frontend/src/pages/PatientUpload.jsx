import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import UnifiedChat from '../components/UnifiedChat';
import { useToast } from '../context/ToastContext';

const PatientUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('none');
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Client-side validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSizeMB = 5;

      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.type}. Please upload a JPG, PNG, or WebP image.`);
        setSelectedFile(null);
        event.target.value = '';
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is ${maxSizeMB}MB.`);
        setSelectedFile(null);
        event.target.value = '';
        return;
      }
    }
    setError(null);
    setSelectedFile(file);
    setResult(null); // Reset result if file changes
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async (existingImageId = null) => {
    if (!selectedFile && !existingImageId) {
      setError('Please select an image to upload.');
      return;
    }

    setError(null);
    if (!existingImageId) setResult(null);
    setIsAnalyzing(true);

    try {
      let imageId = existingImageId;

      if (!imageId) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await apiClient.post('/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageId = uploadRes.data?.image_id ?? uploadRes.data?.id;
      }

      if (!imageId) {
        throw new Error('Image ID missing');
      }

      const analyzeRes = await apiClient.post(`/api/analysis/${imageId}`);
      setResult(analyzeRes.data);
      
      // Redirect to full case page immediately
      if (analyzeRes.data?.report_id) {
        navigate(`/patient/case/${analyzeRes.data.image_id}`);
      } else if (analyzeRes.data?.image_id) {
         // Fallback if report_id isn't at top level (though it should be)
         navigate(`/patient/case/${analyzeRes.data.image_id}`);
      }
    } catch (err) {
      console.error('Analysis Error:', err.response?.data || err.message);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 'Something went wrong.';
      setError(`Analysis failed: ${errorMsg}`);
      pushToast({
        title: 'Analysis failed',
        message: errorMsg,
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
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold text-charcoal-900">Upload Skin Image</h1>
          <p className="mt-1 text-charcoal-500">
            Upload a clear photo of the affected area for AI-powered analysis
          </p>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Upload Card */}
      <div className="card-warm p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-charcoal-700 mb-3">
                Select Image
              </label>

              {/* Drop Zone */}
              <div className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
                previewUrl
                  ? 'border-warm-300 bg-warm-50/50'
                  : 'border-cream-300 hover:border-warm-300 hover:bg-cream-100'
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
                      className="mt-3 text-sm text-charcoal-500 hover:text-red-500 transition-colors"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-64 cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warm-100 border border-warm-200 mb-4">
                        <svg className="h-7 w-7 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-charcoal-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-charcoal-400">
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
            <div className="rounded-xl bg-cream-100 border border-cream-300 p-4">
              <h4 className="text-sm font-semibold text-charcoal-700 mb-2">Tips for best results</h4>
              <ul className="space-y-1.5 text-sm text-charcoal-600">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-sage-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Use good lighting (natural light works best)
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-sage-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Focus directly on the affected area
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-sage-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Avoid blurry or distant shots
                </li>
              </ul>
            </div>

            {/* Analyze Button */}
            <button
              type="button"
              className="btn-warm w-full py-3.5 text-base"
              disabled={!selectedFile || isAnalyzing}
              onClick={() => handleAnalyze()}
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Analyze Image
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
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
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50">
                <div className="text-center p-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 mb-4">
                    <svg className="h-8 w-8 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal-700">No analysis yet</h3>
                  <p className="mt-2 text-sm text-charcoal-500">
                    Upload an image and click Analyze to see AI insights
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-cream-300 bg-white">
                <div className="text-center p-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warm-100 mb-4">
                    <svg className="h-8 w-8 text-warm-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal-700">Analyzing your image...</h3>
                  <p className="mt-2 text-sm text-charcoal-500">
                    Our AI is examining the skin characteristics
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PatientUpload;
