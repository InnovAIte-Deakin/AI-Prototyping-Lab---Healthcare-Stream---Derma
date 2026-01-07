import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import UnifiedChat from '../components/UnifiedChat';
import PatientUpload from '../pages/PatientUpload';
import { apiClient } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

/* 
  MOCKING WEBSOCKET
  Since jsdom doesn't support WebSocket, we mock it globally.
*/
const originalWebSocket = global.WebSocket;
let lastSocketInstance = null;
const socketTimeouts = new Set();

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.sentMessages = [];
    
    // Track timeout to clear it on cleanup
    const timerId = setTimeout(() => {
        this.readyState = 1; // OPEN
        if (this.onopen) this.onopen();
        socketTimeouts.delete(timerId);
    }, 10);
    socketTimeouts.add(timerId);
  }

  send(data) {
    this.sentMessages.push(data);
  }

  close() {
    if (this.onclose) this.onclose();
  }

  // Helper to simulate receiving a message from server
  mockReceive(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

global.WebSocket = class extends MockWebSocket {
    constructor(url) {
        super(url);
        lastSocketInstance = this;
    }
};

describe('ChatFlows', () => {
  beforeEach(() => {
    vi.mock('../context/AuthContext', async () => {
      const actual = await vi.importActual('../context/AuthContext');
      return {
        ...actual,
        useAuth: () => ({ token: 'fake-token', user: { id: 1, role: 'patient' } }),
        apiClient: {
            get: vi.fn(),
            post: vi.fn(),
        }
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    lastSocketInstance = null;
    // Clear any pending socket timers to prevent "unhandled error" / "state update" warnings
    socketTimeouts.forEach(id => clearTimeout(id));
    socketTimeouts.clear();
  });

  it('UnifiedChat connects and authenticates via WebSocket', async () => {
    render(<UnifiedChat imageId={1} reportId={100} userRole="patient" />);

    // Wait for websocket to be created
    await waitFor(() => expect(lastSocketInstance).not.toBeNull());
    
    // Check connection URL
    expect(lastSocketInstance.url).toContain('/ws/chat/100');

    // Wait for open event which sends auth token
    await waitFor(() => {
        const authMsg = lastSocketInstance.sentMessages[0];
        expect(authMsg).toContain('fake-token');
    });
  });

  it('UnifiedChat displays status update when system message received', async () => {
    const onStatusChangeMock = vi.fn();
    render(
        <UnifiedChat 
            imageId={1} 
            reportId={100} 
            userRole="patient" 
            onStatusChange={onStatusChangeMock} 
        />
    );

    // Wait for socket
    await waitFor(() => expect(lastSocketInstance).not.toBeNull());

    // Simulate connection success
    act(() => {
        lastSocketInstance.mockReceive({
            type: 'connected',
            messages: []
        });
    });

    // Simulate system message (e.g. Doctor Assigned)
    act(() => {
        lastSocketInstance.mockReceive({
            type: 'new_message',
            id: 1,
            sender_role: 'system',
            message: 'A physician has been assigned',
            created_at: new Date().toISOString()
        });
    });

    await waitFor(() => {
        expect(screen.getByText('A physician has been assigned')).toBeInTheDocument();
        expect(onStatusChangeMock).toHaveBeenCalled();
    });
  });

  it.skip('PatientUpload status refresh integration', async () => {
    // Setup API mocks
    apiClient.post.mockResolvedValueOnce({ 
        data: { image_id: 1, id: 1 } // Upload response
    });
    apiClient.post.mockResolvedValueOnce({ 
        data: { report_id: 100, image_id: 1, review_status: 'pending' } // Analysis response
    });
    
    // Mock the status check call
    apiClient.get.mockResolvedValueOnce({
        data: { review_status: 'accepted' }
    });

    render(
        <MemoryRouter>
            <PatientUpload />
        </MemoryRouter>
    );

    // 1. Simulate Upload & Analyze
    const file = new File(['(⌐□_□)'], 'skin.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [file] } });
    
    const analyzeBtn = screen.getByText('Analyze');
    fireEvent.click(analyzeBtn);

    // 2. Wait for Analyze to finish and Chat to appear
    await waitFor(() => expect(screen.getByText(/Pending Review/i)).toBeInTheDocument());

    // 3. Now verify WebSocket is active in the child component
    await waitFor(() => expect(lastSocketInstance).not.toBeNull());
    
    // 4. Trigger a status change simulation via WebSocket (system message)
    act(() => {
        lastSocketInstance.mockReceive({
            type: 'connected',
            messages: []
        });
    });

    // Send a system message which triggers onStatusChange in UnifiedChat -> PatientUpload
    act(() => {
        lastSocketInstance.mockReceive({
            type: 'new_message',
            sender_role: 'system',
            message: 'Dr. House accepted the case'
        });
    });

    // 5. Verify that PatientUpload calls the API to refresh status
    await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/analysis\/report\/100/)
        );
    });
  });
});
