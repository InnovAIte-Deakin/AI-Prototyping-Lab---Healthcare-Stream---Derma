import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const UnifiedChat = ({ imageId, reportId, isPaused, userRole, onStatusChange }) => {
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
  
  // Keep the ref updated with the latest callback
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (!reportId || !token) {
      console.log('[WS] Missing reportId or token, not connecting');
      return;
    }

    const connect = () => {
      if (!mountedRef.current) {
        console.log('[WS] Component unmounted, skipping connection');
        return;
      }

      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Reconnecting');
        } catch (e) {}
        wsRef.current = null;
      }

      const wsUrl = `ws://localhost:8000/ws/chat/${reportId}`;
      console.log('[WS] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close(1000, 'Component unmounted');
          return;
        }
        console.log('[WS] Connected, sending auth...');
        ws.send(JSON.stringify({ token }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('[WS] Authenticated successfully');
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
            
            // Notify parent of status changes (system messages indicate status changes)
            if (data.sender_role === 'system' && onStatusChangeRef.current) {
              console.log('[WS] Calling onStatusChange due to system message');
              onStatusChangeRef.current();
            }
          } else if (data.type === 'status_update') {
            // Handle status updates
            if (onStatusChangeRef.current) {
              console.log('[WS] Calling onStatusChange due to status_update');
              onStatusChangeRef.current();
            }
          } else if (data.error) {
            console.error('[WS] Server error:', data.error);
            setIsConnected(false);
          }
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('[WS] Disconnected, code:', event.code);
        
        if (!mountedRef.current) return;
        
        setIsConnected(false);
        wsRef.current = null;
        
        if (mountedRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log('[WS] Attempting reconnect...');
              connect();
            }
          }, 2000);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    };

    const initialTimeout = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 100);

    return () => {
      console.log('[WS] Cleanup - closing connection');
      mountedRef.current = false;
      clearTimeout(initialTimeout);
      clearTimeout(reconnectTimeoutRef.current);
      
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (e) {}
        wsRef.current = null;
      }
    };
  }, [reportId, token, onStatusChange]);

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

  // Render message based on sender role
  const renderMessage = (m) => {
    const isMe = m.sender_role === userRole;
    
    // System messages (doctor assigned, case closed, etc.)
    if (m.sender_role === 'system') {
      return (
        <div key={m.id} className="flex justify-center my-4">
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-xl px-6 py-3 max-w-[90%] shadow-sm">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-lg">📢</span>
              <p className="text-sm font-medium text-purple-800 text-center">
                {m.message}
              </p>
            </div>
            <p className="text-[9px] text-purple-500 text-center mt-1 font-bold uppercase">
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
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">DermaAI Assistant</span>
                <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">AI</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <div className="text-[9px] mt-2 font-bold text-slate-400 uppercase">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Doctor messages
    if (m.sender_role === 'doctor') {
      if (isMe) {
        // Doctor viewing their own message
        return (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[80%] bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <div className="text-[9px] mt-2 font-bold opacity-50 uppercase text-right">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
      } else {
        // Patient seeing doctor's message
        return (
          <div key={m.id} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">👨‍⚕️</span>
              </div>
              <div className="bg-indigo-600 text-white rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Physician</span>
                  <span className="bg-white/20 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">HUMAN</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                <div className="text-[9px] mt-2 font-bold opacity-50 uppercase">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
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
            <div className="max-w-[80%] bg-slate-900 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <div className="text-[9px] mt-2 font-bold opacity-40 uppercase text-right">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
      } else {
        // Doctor seeing patient's message
        return (
          <div key={m.id} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">👤</span>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Patient</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                <div className="text-[9px] mt-2 font-bold text-slate-400 uppercase">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
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
    <div className="flex flex-col h-[500px] border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? (isPaused ? 'bg-indigo-400' : 'bg-green-400') : 'bg-yellow-400'} animate-pulse`}></div>
          <span className="text-sm font-bold tracking-tight text-white">
            {isPaused ? '👨‍⚕️ PHYSICIAN CONSULTATION' : '🤖 AI DERMATOLOGY ASSISTANT'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <span className="text-[10px] font-black bg-yellow-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">
              CONNECTING...
            </span>
          )}
          {isPaused && isConnected && (
            <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">
              HUMAN PHYSICIAN ACTIVE
            </span>
          )}
          {!isPaused && isConnected && (
            <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">
              AI RESPONDING
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
            <p>{isConnected ? 'No messages yet. Start the conversation!' : 'Connecting to chat...'}</p>
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
            placeholder={!isConnected ? "Connecting..." : isPaused ? "Send a message to the physician..." : "Ask your follow-up question..."}
            className="w-full bg-slate-100 rounded-2xl border-none pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400 font-medium disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isConnected || isLoading || !input.trim()}
            className="absolute right-2 top-2 h-10 w-10 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-20 transition-all flex items-center justify-center shadow-lg"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </form>
        <div className="flex items-center justify-center gap-2 mt-2">
          {isPaused ? (
            <>
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">
                A human physician is reviewing your case
              </p>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">
                AI assistant is ready to help
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedChat;
