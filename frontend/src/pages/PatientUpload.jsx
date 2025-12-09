import React, { useState } from 'react';
import { apiClient } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { uiTokens } from '../components/Layout';

const PatientUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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
    } catch (err) {
      console.error('Analysis Error:', err.response?.data || err.message);
      setError(`Analysis failed: ${err.response?.data?.detail || 'Something went wrong.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Patient Upload</h1>
        <p className="text-sm text-slate-500">
          Upload a clear photo of the affected skin area to generate an AI-assisted report.
        </p>
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
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {result && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
            <h2 className="text-lg font-semibold text-slate-900">Analysis Result</h2>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientUpload;
