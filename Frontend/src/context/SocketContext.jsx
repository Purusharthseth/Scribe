import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, vaultId, shareToken }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [users, setUsers] = useState([]);
  const { getToken } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    //this is all context functionality.
    if (!vaultId) return;

    const initializeSocket = async () => {
     //this is the socket initializer.
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
            toast.error('Failed to connect.');
          }

          reconnectAttempts.current += 1;
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('🔌 Max reconnection attempts reached');
            socketInstance.disconnect();
          }
        });

        // User presence handlers with proper cleanup
        const handleUserJoined = (data) => {
          console.log('👤 User joined:', data);
          toast(`${data.user} joined the vault`, {
            icon: '👋',
            duration: 3000,
          });
        };

        const handleUserLeft = (data) => {
          console.log('👤 User left:', data);
          toast(`${data.user} left the vault`, {
            icon: '👋',
            duration: 3000,
          });
        };

        socketInstance.on('user:joined', handleUserJoined);
        socketInstance.on('user:left', handleUserLeft);

        setSocket(socketInstance);
        return { socketInstance, handleUserJoined, handleUserLeft };

      } catch (error) {
        console.error('🔌 Failed to initialize socket:', error);
        setConnectionError('Failed to initialize connection');
        toast.error('Failed to initialize real-time connection');
        return null;
      }
    };

    let cleanupData = null;
    initializeSocket().then(data => {
      cleanupData = data;
    });

    return () => {
      if (cleanupData) {
        const { socketInstance, handleUserJoined, handleUserLeft } = cleanupData;
        socketInstance.off('user:joined', handleUserJoined);
        socketInstance.off('user:left', handleUserLeft);
        socketInstance.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setUsers([]);
    };
  }, [vaultId, shareToken, getToken]);

  const onFileTreeUpdate = (cb) => {
    if (socket) {
      socket.on('file-tree:updated', cb);
      return () => socket.off('file-tree:updated', cb);
    }
    return () => {};
  };

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
