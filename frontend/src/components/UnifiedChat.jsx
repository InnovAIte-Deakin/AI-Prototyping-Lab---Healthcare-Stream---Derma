import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// eslint-disable-next-line no-unused-vars
const UnifiedChat = ({ imageId, reportId, isPaused, userRole, onStatusChange, doctor }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

      const wsUrl = `ws://localhost:8000/ws/chat/${reportId}`;
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

    // System messages
    if (m.sender_role === 'system') {
      return (
        <div key={m.id} className="flex justify-center my-4">
          <div className="bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200/60 rounded-2xl px-5 py-3 max-w-[90%]">
            <p className="text-sm font-medium text-violet-800 text-center">
              {m.message}
            </p>
            <p className="text-[10px] text-violet-500 text-center mt-1">
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      );
    }

    // AI messages
    if (m.sender_role === 'ai') {
      return (
        <div key={m.id} className="flex justify-start">
          <div className="flex gap-3 max-w-[85%]">
            <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-teal-700">SkinScope AI</span>
                <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">AI</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <p className="text-[10px] text-slate-400 mt-2">
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
        return (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[80%] bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <p className="text-[10px] mt-2 opacity-60 text-right">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      } else {
        return (
          <div key={m.id} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                {doctor?.avatar_url ? (
                  <img src={doctor.avatar_url} alt="Doctor" className="w-full h-full object-cover" />
                ) : (
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
              <div className="bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-violet-200">{doctor?.full_name || 'Physician'}</span>
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">MD</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                <p className="text-[10px] mt-2 opacity-60">
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
        return (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[80%] bg-slate-900 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <p className="text-[10px] mt-2 opacity-50 text-right">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      } else {
        return (
          <div key={m.id} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-200/80">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Patient</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                <p className="text-[10px] text-slate-400 mt-2">
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
        <div className="bg-slate-100 rounded-xl px-4 py-3">
          <p className="text-sm">{m.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[500px] rounded-2xl bg-white border border-slate-200/80 shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3.5 flex justify-between items-center flex-shrink-0 ${
        isPaused
          ? 'bg-gradient-to-r from-violet-600 to-purple-600'
          : 'bg-gradient-to-r from-slate-800 to-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${
            isConnected
              ? (isPaused ? 'bg-violet-300' : 'bg-emerald-400')
              : 'bg-amber-400'
          } pulse-dot`} />
          <span className="text-sm font-semibold text-white">
            {isPaused ? 'Physician Consultation' : 'AI Dermatology Assistant'}
          </span>
        </div>
        <div>
          {!isConnected && (
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white">
              Connecting...
            </span>
          )}
          {isPaused && isConnected && (
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white">
              Physician Active
            </span>
          )}
          {!isPaused && isConnected && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
              AI Responding
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm">{isConnected ? 'Start the conversation!' : 'Connecting...'}</p>
          </div>
        )}
        {messages.map(renderMessage)}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected || isLoading}
            placeholder={!isConnected ? "Connecting..." : isPaused ? "Message physician..." : "Ask a question..."}
            className="w-full bg-slate-100 rounded-xl border-none pl-4 pr-14 py-3.5 text-sm focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!isConnected || isLoading || !input.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 ${
              isPaused
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
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
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`h-1.5 w-1.5 rounded-full pulse-dot ${isPaused ? 'bg-violet-500' : 'bg-teal-500'}`} />
          <p className={`text-[10px] font-medium ${isPaused ? 'text-violet-600' : 'text-teal-600'}`}>
            {isPaused ? 'Physician is reviewing your case' : 'AI assistant ready'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChat;
