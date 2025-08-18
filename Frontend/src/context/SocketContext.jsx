import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, vaultId, shareToken }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [users, setUsers] = useState([]);
  const { getToken } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!vaultId) return;

    const initializeSocket = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setConnectionError('Authentication token not available');
          return;
        }

        const socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', {
          auth: {
            token,
            vaultId,
            shareToken: shareToken || undefined,
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        // Connection handlers
        socketInstance.on('connect', () => {
          console.log('🔌 Connected to Socket.IO server');
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttempts.current = 0;
          toast.success('Connected to real-time updates');
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from Socket.IO server:', reason);
          setIsConnected(false);
          if (reason !== 'io client disconnect') {
            toast.error('Lost connection to real-time updates');
          }
        });

        socketInstance.on('connect_error', (error) => {
          console.error('🔌 Socket connection error:', error);
          setIsConnected(false);
          
          try {
            const errorData = JSON.parse(error.message);
            setConnectionError(`Connection failed: ${errorData.message} (${errorData.statusCode})`);
            toast.error(`Connection failed: ${errorData.message}`);
          } catch {
            setConnectionError(`Connection failed: ${error.message}`);
            toast.error('Failed to connect to real-time updates');
          }

          // Handle reconnection attempts
          reconnectAttempts.current += 1;
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('🔌 Max reconnection attempts reached');
            socketInstance.disconnect();
          }
        });

        // User presence handlers
        socketInstance.on('user:joined', (data) => {
          console.log('👤 User joined:', data);
          toast(`${data.user} joined the vault`, {
            icon: '👋',
            duration: 3000,
          });
        });

        socketInstance.on('user:left', (data) => {
          console.log('👤 User left:', data);
          toast(`${data.user} left the vault`, {
            icon: '👋',
            duration: 3000,
          });
        });

        setSocket(socketInstance);

      } catch (error) {
        console.error('🔌 Failed to initialize socket:', error);
        setConnectionError('Failed to initialize connection');
        toast.error('Failed to initialize real-time connection');
      }
    };

    initializeSocket();

    // Cleanup on unmount or vaultId change
    return () => {
      setSocket(prevSocket => {
        if (prevSocket) {
          console.log('🔌 Cleaning up socket connection');
          prevSocket.disconnect();
          setIsConnected(false);
          setConnectionError(null);
          setUsers([]);
        }
        return null;
      });
    };
  }, [vaultId, shareToken, getToken]);

  // Socket event listeners for file tree updates
  const onFileTreeUpdate = (callback) => {
    if (socket) {
      socket.on('file-tree:updated', callback);
      return () => socket.off('file-tree:updated', callback);
    }
    return () => {};
  };

  // Emit custom events (if needed in the future)
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('🔌 Cannot emit event: socket not connected');
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    users,
    onFileTreeUpdate,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
