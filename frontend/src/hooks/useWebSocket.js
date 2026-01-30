import { useEffect, useRef, useState, useCallback } from 'react';
import { getCookie } from '../utils/cookies';

const WS_RECONNECT_INTERVAL = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Hook for WebSocket connections
 * @param {Function} onMessage - Callback for incoming messages
 * @param {Object} options - Configuration options
 * @param {string} options.scanId - If provided, creates a scan-specific connection
 * @param {boolean} options.autoConnect - Whether to connect automatically (default: true)
 */
export function useWebSocket(onMessage, options = {}) {
  const { scanId = null, autoConnect = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const scanIdRef = useRef(scanId);

  // Update scanId ref when it changes
  useEffect(() => {
    scanIdRef.current = scanId;
  }, [scanId]);

  const getWsUrl = useCallback(() => {
    const token = getCookie('auth_token');
    if (!token) return null;
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    
    let url = `${wsProtocol}://${wsHost}/ws/notifications?token=${token}`;
    
    // Add scan_id if provided (for scan-specific connections)
    if (scanIdRef.current) {
      url += `&scan_id=${scanIdRef.current}`;
    }
    
    return url;
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

  // Connect on mount (if autoConnect), disconnect on unmount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage
  };
}

/**
 * Hook specifically for scan-related WebSocket connections
 * Opens a connection when a scan starts, closes when scan completes
 */
export function useScanWebSocket(scanId, onScanComplete) {
  const [scanResult, setScanResult] = useState(null);
  
  const handleMessage = useCallback((data) => {
    if (data.type === 'scan_complete') {
      setScanResult(data.notification);
      if (onScanComplete) {
        onScanComplete(data.notification);
      }
    }
  }, [onScanComplete]);
  
  const ws = useWebSocket(handleMessage, {
    scanId,
    autoConnect: !!scanId // Only connect if scanId is provided
  });
  
  // Connect when scanId becomes available
  useEffect(() => {
    if (scanId && !ws.isConnected) {
      ws.connect();
    }
  }, [scanId, ws.isConnected, ws.connect]);
  
  return {
    ...ws,
    scanResult
  };
}

export default useWebSocket;
