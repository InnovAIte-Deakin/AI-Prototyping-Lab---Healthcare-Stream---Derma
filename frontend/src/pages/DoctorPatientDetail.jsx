import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../context/AuthContext';

function DoctorPatientDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [caseData, setCaseData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch case and chat data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch chat history (includes report status)
        const chatRes = await apiClient.get(`/cases/${reportId}/chat`);
        setChatHistory(chatRes.data.messages || []);
        setCaseData({
          report_id: chatRes.data.report_id,
          doctor_active: chatRes.data.doctor_active,
          review_status: chatRes.data.review_status,
        });

        // Fetch full case details from doctor's all cases
        const casesRes = await apiClient.get('/cases/doctor/all');
        const thisCase = casesRes.data?.cases?.find(c => c.id === parseInt(reportId));
        if (thisCase) {
          setCaseData(prev => ({ ...prev, ...thisCase }));
        }
      } catch (err) {
        console.error('Failed to fetch case:', err);
        const detail = err?.response?.data?.detail;
        setError(detail || 'Failed to load case details.');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchData();
    }
  }, [reportId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleAcceptReview = async () => {
    setAccepting(true);
    setError(null);

    try {
      const res = await apiClient.post(`/cases/${reportId}/accept`);
      setCaseData(prev => ({
        ...prev,
        review_status: res.data.review_status,
        doctor_active: res.data.doctor_active,
      }));
    } catch (err) {
      console.error('Accept error:', err);
      const detail = err?.response?.data?.detail;
      setError(detail || 'Failed to accept review.');
    } finally {
      setAccepting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await apiClient.post(`/cases/${reportId}/chat`, {
        message: message.trim(),
      });

      // Add message to chat
      setChatHistory(prev => [...prev, res.data]);
      setMessage('');

      // Update status if this was first message
      if (caseData?.review_status === 'accepted') {
        setCaseData(prev => ({ ...prev, review_status: 'reviewed' }));
      }
    } catch (err) {
      console.error('Send error:', err);
      const detail = err?.response?.data?.detail;
      setError(detail || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSenderLabel = (role) => {
    const labels = {
      patient: '👤 Patient',
      doctor: '👨‍⚕️ Doctor',
      ai: '🤖 AI Analysis',
    };
    return labels[role] || role;
  };

  const getStatusBadge = (status) => {
    const badges = {
      none: <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">No Request</span>,
      pending: <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">⏳ Pending Review</span>,
      accepted: <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">👁️ In Review</span>,
      reviewed: <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">✅ Reviewed</span>,
    };
    return badges[status] || badges.none;
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Loading case details...</p>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="p-4">
        <p className="text-red-600">{error}</p>
        <button
          className="mt-2 text-blue-600 hover:underline"
          onClick={() => navigate('/doctor-dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            className="text-blue-600 hover:underline text-sm mb-2"
            onClick={() => navigate('/doctor-dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Case Review</h1>
        </div>
        {caseData && getStatusBadge(caseData.review_status)}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Image & AI Analysis */}
        <div className="space-y-4">
          {/* Case Image */}
          {caseData?.image_url && (
            <div className="border rounded-lg overflow-hidden">
              <img
                src={`http://localhost:8000${caseData.image_url}`}
                alt="Case Image"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* AI Analysis */}
          {caseData?.report_json && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🤖 AI Analysis
              </h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 overflow-auto max-h-64">
                {typeof caseData.report_json === 'string'
                  ? (() => {
                    try {
                      const parsed = JSON.parse(caseData.report_json);
                      return parsed.analysis || JSON.stringify(parsed, null, 2);
                    } catch {
                      return caseData.report_json;
                    }
                  })()
                  : JSON.stringify(caseData.report_json, null, 2)}
              </pre>
            </div>
          )}

          {/* Accept Review Button */}
          {caseData?.review_status === 'pending' && (
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              onClick={handleAcceptReview}
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : '✓ Accept Review (Pause AI)'}
            </button>
          )}
        </div>

        {/* Right Column: Chat */}
        <div className="border rounded-lg flex flex-col h-[500px]">
          {/* Chat Header */}
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-semibold">💬 Case Discussion</h3>
            <p className="text-xs text-gray-500">
              {caseData?.patient_email || `Patient #${caseData?.patient_id}`}
            </p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No messages yet. Send a message to start the conversation.
              </p>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender_role === 'doctor' ? 'items-end' : 'items-start'
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${msg.sender_role === 'doctor'
                      ? 'bg-blue-600 text-white'
                      : msg.sender_role === 'ai'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-gray-100 text-gray-900'
                      }`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {getSenderLabel(msg.sender_role)}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending || caseData?.review_status === 'pending'}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={sending || !message.trim() || caseData?.review_status === 'pending'}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
            {caseData?.review_status === 'pending' && (
              <p className="text-xs text-yellow-600 mt-2">
                Accept the review first to send messages.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default DoctorPatientDetail;

