import React, { useState } from 'react';
import { apiClient } from '../context/AuthContext';

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
      formData.append('image', selectedFile);

      const uploadRes = await apiClient.post('/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageId = uploadRes.data?.image_id ?? uploadRes.data?.id;

      if (!imageId) {
        throw new Error('Image ID missing');
      }

      const analyzeRes = await apiClient.post(`/images/${imageId}/analyze`);
      setResult(analyzeRes.data);
    } catch (err) {
      setError('Something went wrong while analyzing the image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Patient Upload</h1>
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
          disabled={!selectedFile || isAnalyzing}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>

        {error && <p className="text-red-600">{error}</p>}

        {result && (
          <div className="rounded border p-3">
            <h2 className="text-lg font-semibold">Analysis Result</h2>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientUpload;
