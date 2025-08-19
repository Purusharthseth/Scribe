import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, vaultId, shareToken }) => {
  const authTokenRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [users, setUsers] = useState([]);
  const { getToken } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const canToast = () => typeof document !== 'undefined' && !document.hidden;

  const refreshToken = async () => {
    try {
      authTokenRef.current = await getToken({ skipCache: true });
      return authTokenRef.current;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  };

  const setupSocketListeners = (socketInstance) => {
    const handleUserJoined = (data) => {
      setUsers(prev => {
        const exists = prev.some(u => u.username === data?.user?.username);
        return exists ? prev : [...prev, data.user];
      });
    };

    const handleUserLeft = (data) => {
      setUsers(prev => prev.filter(u => u.username !== data?.user?.username));
    };

    const handleUserList = (data) => {
      setUsers(Array.isArray(data?.users) ? data.users : []);
    };

    socketInstance.on('user:joined', handleUserJoined);
    socketInstance.on('user:left', handleUserLeft);
    socketInstance.on('user:list', handleUserList);

    return () => {
      socketInstance.off('user:joined', handleUserJoined);
      socketInstance.off('user:left', handleUserLeft);
      socketInstance.off('user:list', handleUserList);
    };
  };

  const initializeSocket = async () => {
    try {
      const token = await refreshToken();
      if (!token) {
        setConnectionError('Authentication failed');
        return null;
      }

      const socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', {
        autoConnect: false,
        transports: ['websocket'],
        timeout: 10000,
  forceNew: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: {
          token,
          vaultId,
          shareToken: shareToken || undefined,
        },
      });

      // Core connection listeners
      socketInstance.on('connect', () => {
        reconnectAttempts.current = 0;
        setIsConnected(true);
        setConnectionError(null);
        if (canToast()) toast.success('Connected to real-time updates');
      });

      socketInstance.on('disconnect', (reason) => {
        setIsConnected(false);
        if (reason !== 'io client disconnect') {
          if (canToast()) toast.error(`Disconnected: ${reason}`);
          if (typeof window !== 'undefined') window.location.reload();
        }
      });

      // Enhanced error handling
      socketInstance.on('connect_error', async (err) => {
        setIsConnected(false);
        
        if (err.message.includes('auth') && reconnectAttempts.current < maxReconnectAttempts) {
          const newToken = await refreshToken();
          if (newToken) {
            socketInstance.auth.token = newToken;
            reconnectAttempts.current += 1;
            socketInstance.connect();
            return;
          }
        }

        if (canToast()) {
          toast.error(`Connection error: ${err.message}`);
        }
      });

      socketInstance.on('reconnect_attempt', (attempt) => {
        if (canToast()) toast.loading(`Reconnecting (${attempt}/${maxReconnectAttempts})...`);
      });

      socketInstance.on('reconnect_error', async (err) => {
        const newToken = await refreshToken();
        if (newToken) {
          socketInstance.auth.token = newToken;
          reconnectAttempts.current += 1;
        }
      });

      socketInstance.on('reconnect_failed', () => {
        setConnectionError('Max reconnection attempts reached');
        if (canToast()) {
          toast.error('Max reconnection attempts reached. Reloading page...', {
            duration: 3000
          });
        }
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 3000);
      });
      const cleanupListeners = setupSocketListeners(socketInstance);

      socketInstance.connect();
      return { socketInstance, cleanupListeners };
    } catch (error) {
      console.error('Socket initialization failed:', error);
      setConnectionError('Connection failed');
      if (canToast()) toast.error('Failed to connect to real-time updates');
      return null;
    }
  };

  useEffect(() => {
    if (!vaultId) return;

    let socketCleanup = () => {};

    const setupSocket = async () => {
      const result = await initializeSocket();
      if (result) {
        const { socketInstance, cleanupListeners } = result;
        socketRef.current = socketInstance;
        setSocket(socketInstance);
        socketCleanup = cleanupListeners;
      }
    };

    setupSocket();

    return () => {
      socketCleanup();
      if (socketRef.current) {
        if (socketRef.current.io?.opts) {
          socketRef.current.io.opts.reconnection = false;
        }
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('reconnect_attempt');
        socketRef.current.off('reconnect_error');
        socketRef.current.off('reconnect_failed');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setUsers([]);
      reconnectAttempts.current = 0;
    };
  }, [vaultId, shareToken, getToken]);

  const onFileTreeUpdate = (cb) => {
    if (!socket) return () => {};
    socket.on('file-tree:updated', cb);
    return () => socket.off('file-tree:updated', cb);
  };

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else if (canToast()) {
      toast.error('Not connected to server');
    }
  };

  const value = useMemo(() => ({
    socket,
    isConnected,
    connectionError,
    users,
    onFileTreeUpdate,
    emit,
  }), [socket, isConnected, connectionError, users]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};