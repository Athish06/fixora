import { useEffect, useRef, useState, useCallback } from 'react';
import { getCookie } from '../utils/cookies';

const WS_RECONNECT_INTERVAL = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket(onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  const getWsUrl = useCallback(() => {
    const token = getCookie('auth_token');
    if (!token) return null;
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    
    return `${wsProtocol}://${wsHost}/ws/notifications?token=${token}`;
  }, []);

  const connect = useCallback(() => {
    const wsUrl = getWsUrl();
    if (!wsUrl) {
      console.log('WebSocket: No auth token, skipping connection');
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      console.log('WebSocket: Connecting...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket: Connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong (heartbeat response)
          if (data.type === 'pong') {
            return;
          }
          
          // Handle connected confirmation
          if (data.type === 'connected') {
            console.log('WebSocket: Connection confirmed');
            return;
          }
          
          // Forward message to handler
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('WebSocket: Failed to parse message', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket: Error', error);
        setConnectionError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket: Disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < WS_MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket: Reconnecting (attempt ${reconnectAttemptsRef.current})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WS_RECONNECT_INTERVAL);
        }
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection', error);
      setConnectionError(error.message);
    }
  }, [getWsUrl, onMessage]);

  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage
  };
}

export default useWebSocket;
