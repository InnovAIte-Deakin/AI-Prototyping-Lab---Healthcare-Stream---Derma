import '@testing-library/jest-dom';
import { vi } from 'vitest';

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mock WebSocket for UnifiedChat component tests
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    // Simulate connection after a tick
    setTimeout(() => {
      if (this.onopen) this.onopen({ type: 'open' });
    }, 10);
  }
  send(data) {
    // Mock send - simulate connected response for auth token
    if (data.includes('token')) {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify({ type: 'connected', messages: [] }) });
        }
      }, 10);
    }
  }
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({ code: 1000 });
  }
}

global.WebSocket = MockWebSocket;
