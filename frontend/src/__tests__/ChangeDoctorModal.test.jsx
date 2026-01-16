import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ChangeDoctorModal from '../components/ChangeDoctorModal';
import PatientDashboard from '../pages/PatientDashboard';
import { apiClient } from '../context/AuthContext';

/**
 * RTL Tests for ChangeDoctorModal component
 * 
 * Tests:
 * (a) Modal opens correctly from the dashboard
 * (b) Lists available doctors
 * (c) Displays validation error messages if backend blocks switch due to active case
 */

const mockCurrentDoctor = {
    id: 1,
    full_name: 'Dr. Alice Smith',
    clinic_name: 'City Clinic',
    email: 'alice@example.com',
};

const mockAvailableDoctors = [
    { id: 2, full_name: 'Dr. Bob Jones', clinic_name: 'Health Center', bio: 'Specialist' },
    { id: 3, full_name: 'Dr. Carol Lee', clinic_name: 'Wellness Clinic', bio: 'Board certified' },
];

describe('ChangeDoctorModal', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Modal Rendering', () => {
        it('renders modal with title and doctor list', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                        onError={vi.fn()}
                    />
                </MemoryRouter>
            );

            // Check title
            expect(screen.getByText('Change Doctor')).toBeInTheDocument();
            expect(screen.getByText(/Select a new doctor/i)).toBeInTheDocument();

            // Wait for doctors to load
            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
                expect(screen.getByText('Dr. Carol Lee')).toBeInTheDocument();
            });

            // Buttons should be present
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /confirm change/i })).toBeInTheDocument();
        });

        it('filters out current doctor from list', async () => {
            // Include current doctor in API response
            const doctorsIncludingCurrent = [
                { id: 1, full_name: 'Dr. Alice Smith', clinic_name: 'City Clinic' },
                ...mockAvailableDoctors,
            ];
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: doctorsIncludingCurrent });

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            // Current doctor should be filtered out
            const aliceElements = screen.queryAllByText('Dr. Alice Smith');
            expect(aliceElements.length).toBe(0);
        });

        it('shows loading state while fetching doctors', () => {
            // Make API never resolve
            vi.spyOn(apiClient, 'get').mockImplementation(() => new Promise(() => { }));

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText(/loading available doctors/i)).toBeInTheDocument();
        });

        it('shows message when no other doctors available', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText(/no other doctors available/i)).toBeInTheDocument();
            });
        });
    });

    describe('Doctor Selection', () => {
        it('allows selecting a doctor via radio button', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });
            const user = userEvent.setup();

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            // Get radio buttons
            const radios = screen.getAllByRole('radio');
            expect(radios.length).toBe(2);

            // Select Dr. Bob Jones
            await user.click(radios[0]);
            expect(radios[0]).toBeChecked();
        });

        it('disables confirm button until doctor is selected', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole('button', { name: /confirm change/i });
            expect(confirmButton).toBeDisabled();
        });
    });

    describe('Successful Doctor Change', () => {
        it('calls onSuccess with new doctor data after successful change', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });

            const mockResponse = {
                doctor: { id: 2, full_name: 'Dr. Bob Jones', clinic_name: 'Health Center' },
                status: 'active',
                previous_doctor_id: 1,
            };
            vi.spyOn(apiClient, 'post').mockResolvedValue({ data: mockResponse });

            const onSuccess = vi.fn();
            const user = userEvent.setup();

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={onSuccess}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            // Select doctor
            const radios = screen.getAllByRole('radio');
            await user.click(radios[0]);

            // Click confirm
            const confirmButton = screen.getByRole('button', { name: /confirm change/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(apiClient.post).toHaveBeenCalledWith('/patient/change-doctor', {
                    doctor_id: 2,
                    reason: undefined,
                });
                expect(onSuccess).toHaveBeenCalledWith(mockResponse);
            });
        });
    });

    describe('Error Handling - Active Case Block', () => {
        it('displays validation error when backend blocks switch due to active case', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });

            // Simulate backend rejecting due to active case
            const errorMessage = 'Cannot change doctor while you have an active case (pending or accepted). Please wait for the doctor to complete their review.';
            vi.spyOn(apiClient, 'post').mockRejectedValue({
                response: { data: { detail: errorMessage } },
            });

            const onError = vi.fn();
            const user = userEvent.setup();

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                        onError={onError}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            // Select doctor and try to confirm
            const radios = screen.getAllByRole('radio');
            await user.click(radios[0]);

            const confirmButton = screen.getByRole('button', { name: /confirm change/i });
            await user.click(confirmButton);

            // Should display error message in modal
            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            // Should call onError callback
            expect(onError).toHaveBeenCalledWith(errorMessage);
        });

        it('displays generic error for network failures', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });
            vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network error'));

            const user = userEvent.setup();

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={vi.fn()}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            const radios = screen.getAllByRole('radio');
            await user.click(radios[0]);

            const confirmButton = screen.getByRole('button', { name: /confirm change/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(screen.getByText(/failed to change doctor/i)).toBeInTheDocument();
            });
        });
    });

    describe('Modal Interactions', () => {
        it('calls onClose when cancel button is clicked', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });

            const onClose = vi.fn();
            const user = userEvent.setup();

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={onClose}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            await user.click(cancelButton);

            expect(onClose).toHaveBeenCalled();
        });

        it('calls onClose when clicking overlay background', async () => {
            vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockAvailableDoctors });

            const onClose = vi.fn();

            render(
                <MemoryRouter>
                    <ChangeDoctorModal
                        currentDoctor={mockCurrentDoctor}
                        onClose={onClose}
                        onSuccess={vi.fn()}
                    />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
            });

            // Click the overlay div (the element with aria-modal="true")
            // The handleOverlayClick only triggers if e.target === e.currentTarget
            const dialog = screen.getByRole('dialog');
            fireEvent.click(dialog);

            expect(onClose).toHaveBeenCalled();
        });
    });
});

describe('PatientDashboard - Change Doctor Integration', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows Change Doctor button when patient has linked doctor', async () => {
        // Mock my-doctor API to return linked doctor
        vi.spyOn(apiClient, 'get').mockResolvedValue({
            data: { doctor: mockCurrentDoctor, status: 'active' },
        });

        render(
            <MemoryRouter>
                <PatientDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Dr. Alice Smith')).toBeInTheDocument();
        });

        // Change Doctor button should be visible
        expect(screen.getByRole('button', { name: /change doctor/i })).toBeInTheDocument();
    });

    it('opens modal when Change Doctor button is clicked', async () => {
        vi.spyOn(apiClient, 'get')
            .mockResolvedValueOnce({ data: { doctor: mockCurrentDoctor, status: 'active' } })
            .mockResolvedValueOnce({ data: mockAvailableDoctors });

        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <PatientDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Dr. Alice Smith')).toBeInTheDocument();
        });

        // Click Change Doctor button
        const changeButton = screen.getByRole('button', { name: /change doctor/i });
        await user.click(changeButton);

        // Modal should open
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText(/select a new doctor/i)).toBeInTheDocument();
        });
    });

    it('does not show Change Doctor button when no doctor is linked', async () => {
        // Mock 404 for my-doctor (no doctor linked)
        vi.spyOn(apiClient, 'get')
            .mockRejectedValueOnce({ response: { status: 404 } })
            .mockResolvedValueOnce({ data: mockAvailableDoctors });

        render(
            <MemoryRouter>
                <PatientDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Select a Doctor')).toBeInTheDocument();
        });

        // Change Doctor button should NOT be present
        expect(screen.queryByRole('button', { name: /change doctor/i })).not.toBeInTheDocument();
    });
});
