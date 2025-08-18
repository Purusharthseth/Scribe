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
  const reconnectNotifiedRef = useRef(false); 

  const canToast = () => typeof document !== 'undefined' && !document.hidden;

  useEffect(() => {
    if (!vaultId) return;

    let sock = null;


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

    const init = async () => {
      try {
        authTokenRef.current =
          (await getToken({ skipCache: true }).catch(async () => null)) ||
          (await getToken({ forceRefresh: true }).catch(async () => null)) ||
          (await getToken().catch(async () => null));

        if (!authTokenRef.current) {
          setConnectionError('Authentication token not available');
          return null;
        }

        const socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', {
          autoConnect: false,
          transports: ['websocket'],
          timeout: 10000,
        });

        socketRef.current = socketInstance; // NEW
        socketInstance.auth = {
          token: authTokenRef.current,
          vaultId,
          shareToken: shareToken || undefined,
        };

        socketInstance.on('connect', () => {
          setIsConnected(true);
          setConnectionError(null);
          reconnectNotifiedRef.current = false;
          if (canToast()) toast.success('Connected to real-time updates');
        });
        socketInstance.on('disconnect', (reason) => {
          setIsConnected(false);
          if (reason !== 'io client disconnect' && canToast()) {
            toast.error('Lost connection to real-time updates');
          }
        })
        
        socketInstance.on('connect_error', () => {
          setIsConnected(false);
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        });

        socketInstance.on('user:joined', handleUserJoined);
        socketInstance.on('user:left', handleUserLeft);
        socketInstance.on('user:list', handleUserList);

        socketInstance.connect();
        setSocket(socketInstance);
        sock = socketInstance;
        return socketInstance;
      } catch (e) {
        setConnectionError('Failed to initialize connection');
        if (canToast()) toast.error('Failed to initialize real-time connection');
        return null;
      }
    };

    init();

    return () => {
  if (sock) {
        sock.off('user:joined', handleUserJoined);
        sock.off('user:left', handleUserLeft);
        sock.off('user:list', handleUserList);
        sock.off('connect');
        sock.off('disconnect');
        sock.off('connect_error');
        sock.disconnect();
      }
      socketRef.current = null; // NEW
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setUsers([]);
      reconnectNotifiedRef.current = false;
    };
  }, [vaultId, shareToken, getToken]);
// ...existing code...


  const onFileTreeUpdate = (cb) => {
    if (!socket) return () => {};
    socket.on('file-tree:updated', cb);
    return () => socket.off('file-tree:updated', cb);
  };

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
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