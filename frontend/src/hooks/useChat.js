import { useEffect, useState } from 'react';
import { listenMessages, listenRooms } from '../services/marketplace';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
export function useChat(roomId) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!roomId) return undefined;
    return listenMessages(roomId, (rows, err) => {
      setMessages(rows);
      setError(err?.message || '');
    });
  }, [roomId]);
  const send = body => api(`/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  return { messages, send, error };
}
export function useRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    if (!user) return undefined;
    return listenRooms(user.uid, rows => setRooms(rows));
  }, [user]);
  return rooms;
}
