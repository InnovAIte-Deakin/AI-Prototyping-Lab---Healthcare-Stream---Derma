import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthProvider, apiClient } from '../context/AuthContext';

// Mock apiClient
vi.mock('../context/AuthContext', async () => {
    const actual = await vi.importActual('../context/AuthContext');
    return {
        ...actual,
        apiClient: {
            get: vi.fn(),
            defaults: { headers: { common: {} } },
        },
    };
});

const mockOverviewData = {
    total_patients: 42,
    total_doctors: 8,
    pending_cases: 5,
    average_rating: 4.2,
    recent_cases: [
        {
            id: 1,
            patient_email: 'patient@example.com',
            condition: 'Eczema',
            review_status: 'pending',
            created_at: '2026-01-15T10:00:00Z',
        },
        {
            id: 2,
            patient_email: 'another@example.com',
            condition: 'Acne',
            review_status: 'reviewed',
            created_at: '2026-01-14T09:00:00Z',
        },
    ],
};

const renderAdminDashboard = () => {
    return render(
        <MemoryRouter initialEntries={['/admin-dashboard']}>
            <AuthProvider>
                <Routes>
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                </Routes>
            </AuthProvider>
        </MemoryRouter>
    );
};

describe('AdminDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        apiClient.get.mockImplementation(() => new Promise(() => { })); // Never resolves
        renderAdminDashboard();

        expect(screen.getByText(/loading admin dashboard/i)).toBeInTheDocument();
    });

    it('renders admin dashboard with metrics on successful load', async () => {
        apiClient.get.mockResolvedValueOnce({ data: mockOverviewData });
        renderAdminDashboard();

        await waitFor(() => {
            expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        });

        // Check stat cards
        expect(screen.getByText('42')).toBeInTheDocument(); // Total Patients
        expect(screen.getByText('8')).toBeInTheDocument();  // Total Doctors
        expect(screen.getByText('5')).toBeInTheDocument();  // Pending Cases
        expect(screen.getByText('4.2 ⭐')).toBeInTheDocument(); // Avg Rating
    });

    it('renders recent cases table', async () => {
        apiClient.get.mockResolvedValueOnce({ data: mockOverviewData });
        renderAdminDashboard();

        await waitFor(() => {
            expect(screen.getByText('Recent Cases')).toBeInTheDocument();
        });

        // Check table content
        expect(screen.getByText('patient@example.com')).toBeInTheDocument();
        expect(screen.getByText('Eczema')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('renders error message on API failure', async () => {
        apiClient.get.mockRejectedValueOnce({
            response: { data: { detail: 'Access denied. Admin role required.' } },
        });
        renderAdminDashboard();

        await waitFor(() => {
            expect(screen.getByText('Access denied. Admin role required.')).toBeInTheDocument();
        });
    });

    it('renders N/A for average rating when null', async () => {
        const dataWithNullRating = { ...mockOverviewData, average_rating: null };
        apiClient.get.mockResolvedValueOnce({ data: dataWithNullRating });
        renderAdminDashboard();

        await waitFor(() => {
            expect(screen.getByText('N/A')).toBeInTheDocument();
        });
    });

    it('renders "No cases found" when recent_cases is empty', async () => {
        const dataWithNoCases = { ...mockOverviewData, recent_cases: [] };
        apiClient.get.mockResolvedValueOnce({ data: dataWithNoCases });
        renderAdminDashboard();

        await waitFor(() => {
            expect(screen.getByText('No cases found')).toBeInTheDocument();
        });
    });
});
