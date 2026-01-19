import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════════════════
   UnifiedChat — The Heart of DermaAI Communication

   This isn't just a chat widget. It's where humans connect—whether through
   AI-powered insights or direct physician conversation. The design should
   feel warm, trustworthy, and genuinely helpful.
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
const UnifiedChat = ({ 
  imageId, 
  reportId, 
  isPaused, 
  userRole, 
  onStatusChange, 
  doctor,
  // Rating props (optional - only used for patient view)
  reviewStatus,
  patientRating,
  patientFeedback,
  onRatingSubmit,
  ratingSuccess,
  ratingError,
  isSubmittingRating,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inlineRating, setInlineRating] = useState(0);
  const [inlineFeedback, setInlineFeedback] = useState('');
  const { token } = useAuth();

  const wsRef = useRef(null);
  const scrollRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!reportId || !token) {
      return;
    }

    const connect = () => {
      if (!mountedRef.current) {
        return;
      }

      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Reconnecting');
        } catch {
          // Ignore close errors
        }
        wsRef.current = null;
      }

      const wsUrl = `ws://127.0.0.1:8000/ws/chat/${reportId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close(1000, 'Component unmounted');
          return;
        }
        ws.send(JSON.stringify({ token }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            setIsConnected(true);
            setMessages(data.messages || []);
            scrollToBottom();
          } else if (data.type === 'new_message') {
            setMessages(prev => [...prev, {
              id: data.id,
              sender_role: data.sender_role,
              sender_id: data.sender_id,
              message: data.message,
              created_at: data.created_at
            }]);
            scrollToBottom();

            if (data.sender_role === 'system' && onStatusChangeRef.current) {
              onStatusChangeRef.current();
            }
          } else if (data.type === 'status_update') {
            if (onStatusChangeRef.current) {
              onStatusChangeRef.current();
            }
          } else if (data.error) {
            setIsConnected(false);
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        setIsConnected(false);
        wsRef.current = null;

        if (mountedRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, 2000);
        }
      };

      ws.onerror = () => {};
    };

    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimeout);
      clearTimeout(reconnectTimeoutRef.current);

      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch {
          // Ignore close errors
        }
        wsRef.current = null;
      }
    };
  }, [reportId, token]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || isLoading) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          message: messageText
        }));
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (m) => {
    const isMe = m.sender_role === userRole;

    // System messages - warm notification style
    if (m.sender_role === 'system') {
      return (
        <div key={m.id} className="flex justify-center my-5">
          <div className="bg-cream-100 border border-cream-300 rounded-2xl px-5 py-3 max-w-[85%] shadow-sm">
            <p className="text-sm font-medium text-charcoal-700 text-center">
              {m.message}
            </p>
            <p className="text-[10px] text-charcoal-400 text-center mt-1">
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      );
    }

    // AI messages - warm, helpful assistant
    if (m.sender_role === 'ai') {
      return (
        <div key={m.id} className="flex justify-start">
          <div className="flex gap-3 max-w-[85%]">
            {/* AI Avatar - friendly, not robotic */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-warm-100 border border-warm-200 flex items-center justify-center">
              <span className="text-warm-600 text-xs font-bold">AI</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-cream-200">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-warm-700">Skin Assistant</span>
              </div>
              <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <p className="text-[10px] text-charcoal-400 mt-2">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Doctor messages
    if (m.sender_role === 'doctor') {
      if (isMe) {
        // Doctor's own message (sent by doctor viewing this)
        return (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[80%] bg-deep-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <p className="text-[10px] mt-2 opacity-60 text-right">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      } else {
        // Doctor message viewed by patient
        return (
          <div key={m.id} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              {/* Doctor avatar */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-deep-100 border border-deep-200 flex items-center justify-center overflow-hidden">
                {doctor?.avatar_url ? (
                  <img src={doctor.avatar_url} alt="Doctor" className="w-full h-full object-cover" />
                ) : (
                  <svg className="h-5 w-5 text-deep-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
              <div className="bg-deep-50 border border-deep-100 text-charcoal-800 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-deep-700">{doctor?.full_name || 'Your Physician'}</span>
                  <span className="badge-deep text-[10px] py-0.5">MD</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                <p className="text-[10px] text-charcoal-400 mt-2">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        );
      }
    }

    // Patient messages
    if (m.sender_role === 'patient') {
      if (isMe) {
        // Patient's own message
        return (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[80%] bg-warm-500 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <p className="text-[10px] mt-2 opacity-60 text-right">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      } else {
        // Patient message viewed by doctor
        return (
          <div key={m.id} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center">
                <svg className="h-5 w-5 text-charcoal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-cream-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-charcoal-600">Patient</span>
                </div>
                <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                <p className="text-[10px] text-charcoal-400 mt-2">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        );
      }
    }

    // Fallback
    return (
      <div key={m.id} className="flex justify-start">
        <div className="bg-cream-100 rounded-xl px-4 py-3">
          <p className="text-sm text-charcoal-700">{m.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[500px] rounded-2xl bg-white border border-cream-300 shadow-lg overflow-hidden">
      {/* Header - warm, contextual */}
      <div className={`px-5 py-4 flex justify-between items-center flex-shrink-0 ${
        isPaused
          ? 'bg-deep-600'
          : 'bg-charcoal-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${
            isConnected
              ? (isPaused ? 'bg-deep-200' : 'bg-sage-400')
              : 'bg-amber-400'
          } status-dot`} />
          <span className="text-sm font-semibold text-white">
            {isPaused ? 'Physician Consultation' : 'Skin Assistant'}
          </span>
        </div>
        <div>
          {!isConnected && (
            <span className="text-xs font-medium text-white/70 bg-white/10 px-3 py-1 rounded-full">
              Connecting...
            </span>
          )}
          {isPaused && isConnected && (
            <span className="badge-deep bg-white/20 border-white/30 text-white text-[10px]">
              Doctor Active
            </span>
          )}
          {!isPaused && isConnected && (
            <span className="badge-sage text-[10px]">
              AI Ready
            </span>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-cream-50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-charcoal-400">
            <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium">{isConnected ? 'Start the conversation' : 'Connecting...'}</p>
            <p className="text-xs text-charcoal-400 mt-1">
              {isPaused ? 'Your physician is ready to help' : 'Ask questions about your skin analysis'}
            </p>
          </div>
        )}
        {messages.map(renderMessage)}
        
        {/* Inline Rating Card - appears when case is reviewed and user is patient */}
        {userRole === 'patient' && reviewStatus === 'reviewed' && (
          <div className="flex justify-center my-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-5 max-w-[95%] shadow-lg w-full">
              <div className="flex items-center gap-2 justify-center mb-3">
                <span className="text-2xl">⭐</span>
                <h3 className="text-lg font-bold text-amber-800">Rate Your Experience</h3>
              </div>
              <p className="text-sm text-amber-700 text-center mb-4">
                How was your consultation with {doctor?.full_name || 'your physician'}?
              </p>
              
              {patientRating ? (
                // Already rated - show read-only view
                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-500 text-2xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>{star <= patientRating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  {patientFeedback && (
                    <p className="text-sm text-amber-800 italic" data-testid="feedback-display">
                      "{patientFeedback}"
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded-full">
                      ✓ Submitted
                    </span>
                  </div>
                  {ratingSuccess && (
                    <p className="text-sm text-green-600 font-medium">{ratingSuccess}</p>
                  )}
                </div>
              ) : (
                // Not yet rated - show rating form
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setInlineRating(star)}
                        className={`text-3xl transition-transform hover:scale-110 ${inlineRating >= star ? 'text-amber-500' : 'text-slate-300'} hover:text-amber-500`}
                        aria-label={`${star} star`}
                        data-testid={`star-${star}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={inlineFeedback}
                    onChange={(e) => setInlineFeedback(e.target.value)}
                    placeholder="Optional: Share your feedback..."
                    className="w-full rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {ratingError && (
                    <p className="text-sm text-red-600 text-center">{ratingError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onRatingSubmit && onRatingSubmit(inlineRating, inlineFeedback)}
                    disabled={isSubmittingRating || !inlineRating}
                    className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-all shadow-md"
                  >
                    {isSubmittingRating ? '⏳ Submitting...' : '🌟 Submit Rating'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-cream-200 flex-shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected || isLoading}
            placeholder={!isConnected ? "Connecting..." : isPaused ? "Message your physician..." : "Ask a question about your skin..."}
            className="w-full bg-cream-50 rounded-xl border border-cream-300 pl-4 pr-14 py-3.5 text-sm focus:ring-2 focus:ring-warm-400 focus:border-warm-400 transition-all placeholder:text-charcoal-400 disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!isConnected || isLoading || !input.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 ${
              isPaused
                ? 'bg-deep-600 hover:bg-deep-700 text-white'
                : 'bg-warm-500 hover:bg-warm-600 text-white'
            }`}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-center text-[10px] text-charcoal-400 mt-2">
          {isPaused ? 'Your physician is reviewing your case' : 'AI-powered assistance • Not medical advice'}
        </p>
      </div>
    </div>
  );
};

export default UnifiedChat;
