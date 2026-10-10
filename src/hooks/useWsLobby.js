/* eslint-disable no-empty */
import { useRef, useEffect } from 'react';
import { WS_BACKEND_URL } from '../components/vsModeConstants';

export default function useWsLobby({ onMessage, onOpen, onClose, onError } = {}) {
  const socketRef = useRef(null);
  const connectionRef = useRef(null);
  const disconnectReasonRef = useRef(null);

  const sendMessage = (type, data = {}) => {
    const conn = connectionRef.current;
    if (!conn || conn.readyState !== WebSocket.OPEN) return;
    try {
      conn.send(JSON.stringify({ type, data }));
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // ignore send errors
    }
  };

  const teardownNetwork = (notifyPeer = false, reason = 'manual') => {
    const conn = connectionRef.current;
    if (notifyPeer && conn?.readyState === WebSocket.OPEN) {
      try {
        conn.send(JSON.stringify({ type: 'match:leave', data: { reason } }));
      } catch {}
    }

    if (conn) {
      try {
        disconnectReasonRef.current = reason;
        conn.close();
      } catch {}
      connectionRef.current = null;
    }

    socketRef.current = null;
  };

  const connectBackend = (onOpenLocal) => {
    teardownNetwork(false, 'switching');

    const socket = new WebSocket(WS_BACKEND_URL);
    socketRef.current = socket;
    connectionRef.current = socket;

    socket.addEventListener('open', () => {
      if (typeof onOpenLocal === 'function') onOpenLocal(socket);
      if (typeof onOpen === 'function') onOpen(socket);
    });

    socket.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (typeof onMessage === 'function') onMessage(parsed);
      } catch {
        // ignore malformed payloads
      }
    });

    socket.addEventListener('close', () => {
      const reason = disconnectReasonRef.current;
      disconnectReasonRef.current = null;
      socketRef.current = null;
      if (connectionRef.current === socket) connectionRef.current = null;

      if (reason) return;
      if (typeof onClose === 'function') onClose();
    });

    socket.addEventListener('error', () => {
      if (typeof onError === 'function') onError();
    });

    return socket;
  };

  // cleanup when hook unmounts
  useEffect(() => () => teardownNetwork(false), []);

  return { connectBackend, sendMessage, teardownNetwork, connectionRef, socketRef, disconnectReasonRef };
}
