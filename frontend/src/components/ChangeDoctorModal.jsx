import { useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';
import { uiTokens } from './Layout';

/**
 * Modal for changing the patient's linked doctor.
 * 
 * Props:
 * - currentDoctor: Current doctor object (to exclude from list)
 * - onClose: Callback when modal is closed
 * - onSuccess: Callback with new doctor data after successful change
 * - onError: Optional callback for error handling
 */
function ChangeDoctorModal({ currentDoctor, onClose, onSuccess, onError }) {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await apiClient.get('/doctors');
                // Filter out current doctor
                const currentId = currentDoctor?.id || currentDoctor?.doctor?.id;
                const filtered = (res.data || []).filter(d => d.id !== currentId);
                setDoctors(filtered);
            } catch (err) {
                console.error('Failed to load doctors:', err);
                setError('Could not load available doctors. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, [currentDoctor]);

    const handleSubmit = async () => {
        if (!selectedId) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await apiClient.post('/patient/change-doctor', {
                doctor_id: selectedId,
                reason: reason.trim() || undefined
            });
            onSuccess(res.data);
        } catch (err) {
            const message = err.response?.data?.detail || 'Failed to change doctor. Please try again.';
            setError(message);
            onError?.(message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle overlay click to close
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-doctor-title"
        >
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl mx-4">
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 id="change-doctor-title" className="text-lg font-semibold text-slate-900">
                        Change Doctor
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Select a new doctor to link with your account.
                    </p>
                </div>

                {/* Body */}
                <div className="px-6 py-4 max-h-80 overflow-y-auto">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <p className="text-slate-600">Loading available doctors...</p>
                    ) : doctors.length === 0 ? (
                        <p className="text-slate-600">No other doctors available at this time.</p>
                    ) : (
                        <div className="space-y-3">
                            {doctors.map(doctor => (
                                <label
                                    key={doctor.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${selectedId === doctor.id
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="doctor"
                                        value={doctor.id}
                                        checked={selectedId === doctor.id}
                                        onChange={() => setSelectedId(doctor.id)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">
                                            {doctor.full_name || doctor.name || 'Doctor'}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {doctor.clinic_name || 'Clinic unavailable'}
                                        </p>
                                        {doctor.bio && (
                                            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                                                {doctor.bio}
                                            </p>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Optional reason field */}
                    {doctors.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Reason for change (optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Closer location, specialty preference..."
                                className={`${uiTokens.input} resize-none`}
                                rows={2}
                                maxLength={500}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedId || submitting || doctors.length === 0}
                        className={uiTokens.primaryButton}
                    >
                        {submitting ? 'Changing...' : 'Confirm Change'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChangeDoctorModal;
