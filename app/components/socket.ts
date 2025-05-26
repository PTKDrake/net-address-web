import { io, type Socket } from 'socket.io-client';

// Dynamic socket URL based on environment
const SOCKET_URL = process.client 
  ? window.location.origin 
  : 'http://localhost:3000';

// Create singleton socket instance
let socket: Socket | null = null;

// Manager for tracking active listeners and preventing conflicts
class SocketManager {
  private static instance: SocketManager;
  private activeListeners = new Set<string>();
  private componentInstances = new Map<string, any>();
  private currentCallbacks: any = null;

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  registerComponent(componentId: string, callbacks: any) {
    console.log(`🔧 Registering component: ${componentId}`);
    console.log(`📊 Current instances: ${this.componentInstances.size}, Socket connected: ${socket?.connected}`);
    
    // Remove previous instance if exists
    if (this.componentInstances.has(componentId)) {
      console.log(`🔄 Component ${componentId} already exists, unregistering first`);
      this.unregisterComponent(componentId);
    }

    this.componentInstances.set(componentId, callbacks);
    console.log(`✅ Component registered. Total components: ${this.componentInstances.size}`);
    
    // If this is the first component or callbacks changed, setup listeners
    if (this.componentInstances.size === 1 || this.currentCallbacks !== callbacks) {
      console.log(`🔧 Setting up listeners (first component or new callbacks)`);
      
      if (socket?.connected) {
        this.setupListeners(callbacks);
        this.currentCallbacks = callbacks;
      } else {
        console.log(`⏳ Socket not connected yet, will setup listeners on connect`);
        // Setup listeners when socket connects
        const onConnect = () => {
          console.log(`🔗 Socket connected, setting up delayed listeners`);
          this.setupListeners(callbacks);
          this.currentCallbacks = callbacks;
          socket?.off('connect', onConnect); // Remove this listener
        };
        socket?.on('connect', onConnect);
      }
    } else {
      console.log(`⏭️ Skipping listener setup - already configured`);
    }
  }

  unregisterComponent(componentId: string) {
    console.log(`🧹 Unregistering component: ${componentId}`);
    this.componentInstances.delete(componentId);
    
    // If no more components, cleanup listeners
    if (this.componentInstances.size === 0) {
      this.cleanupListeners();
      this.currentCallbacks = null;
    }
  }

  private setupListeners(callbacks: any) {
    if (!socket) {
      console.error('❌ Socket instance is null, cannot setup listeners');
      return;
    }

    if (!socket.connected) {
      console.warn('⚠️ Socket not connected, will setup listeners anyway and wait for connection');
      console.log('🔗 Socket state:', {
        connected: socket.connected,
        disconnected: socket.disconnected,
        id: socket.id
      });
    }

    console.log('🔧 Setting up consolidated socket listeners...');
    
    // Clean existing listeners first
    this.cleanupListeners();

    // Setup new listeners
    if (callbacks.onDeviceUpdate) {
      socket.on('device-update', (device) => {
        console.log(`📨 Device update: ${device?.name} (${device?.macAddress}) - ${device?.isConnected ? 'Connected' : 'Disconnected'}`);
        
        // Broadcast to all registered components
        this.componentInstances.forEach((cb, componentId) => {
          if (cb.onDeviceUpdate) {
            try {
              cb.onDeviceUpdate(device);
            } catch (error) {
              console.error(`❌ Error sending update to ${componentId}:`, error);
            }
          }
        });
      });
      this.activeListeners.add('device-update');
    }

    if (callbacks.onDeviceDisconnect) {
      socket.on('device-disconnect', (macAddress) => {
        console.log('📨 Device disconnect received:', macAddress);
        this.componentInstances.forEach((cb) => {
          if (cb.onDeviceDisconnect) cb.onDeviceDisconnect(macAddress);
        });
      });
      this.activeListeners.add('device-disconnect');
    }

    if (callbacks.onDeviceShutdown) {
      socket.on('device-shutdown', (macAddress) => {
        console.log('📨 Device shutdown received:', macAddress);
        this.componentInstances.forEach((cb) => {
          if (cb.onDeviceShutdown) cb.onDeviceShutdown(macAddress);
        });
      });
      this.activeListeners.add('device-shutdown');
    }

    // Setup reconnection handler
    if (!this.activeListeners.has('reconnect')) {
      socket.on('reconnect', () => {
        console.log('🔄 Socket reconnected, notifying components');
        this.componentInstances.forEach((cb) => {
          if (cb.onReconnect) cb.onReconnect();
        });
      });
      this.activeListeners.add('reconnect');
    }

    console.log(`✅ Socket listeners setup complete (${this.activeListeners.size} listeners)`);
  }

  private cleanupListeners() {
    if (!socket) return;

    console.log('🧹 Cleaning up socket listeners...');
    
         // Remove specific listeners
    this.activeListeners.forEach(event => {
      socket?.off(event);
    });
    
    this.activeListeners.clear();
    console.log('✅ Socket listeners cleanup complete');
  }

  getActiveComponents() {
    return Array.from(this.componentInstances.keys());
  }
}

// Initialize socket connection
const initSocket = (): Socket => {
  // If socket exists and is connected, return it
  if (socket && socket.connected) {
    console.log('🔄 Reusing existing socket connection:', socket.id);
    return socket;
  }

  // Disconnect existing socket if it exists but is disconnected
  if (socket && !socket.connected) {
    console.log('🧹 Cleaning up disconnected socket');
    socket.disconnect();
    socket = null;
  }

  console.log('🔌 Initializing Socket.IO connection...');
  console.log('🔗 Socket URL:', SOCKET_URL);
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    retries: 3,
    autoConnect: true,
    forceNew: false, // Reuse existing connection if possible
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id);
    
    // Test listener to check if events are received
    socket?.on('device-update', (data) => {
      console.log('🧪 [RAW] device-update event received:', data);
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected:', reason);
    console.log('📊 Disconnect stats:', {
      id: socket?.id,
      reason,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection error:', error);
    console.log('📊 Connection error stats:', {
      id: socket?.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
    console.log('📊 Reconnect stats:', {
      id: socket?.id,
      attemptNumber,
      timestamp: new Date().toISOString()
    });
  });

  // Debug: Listen to all events (simplified logging)
  socket.onAny((eventName, ...args) => {
    if (eventName.startsWith('device-')) {
      console.log(`📡 Socket event: ${eventName}`, args[0]?.macAddress || args[0]);
    }
  });

  return socket;
};

// Get socket instance
export const getSocket = (): Socket => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Authenticate user with socket
export const authenticateSocket = async (userId: string, userRole?: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socketInstance = getSocket();
    
    if (!socketInstance.connected) {
      console.warn('⚠️ Socket not connected for authentication');
      reject(new Error('Socket not connected'));
      return;
    }

    console.log(`🔐 Authenticating socket for user: ${userId} (Role: ${userRole})`);

    const timeoutId = setTimeout(() => {
      console.error('⏰ Socket authentication timeout');
      socketInstance.off('auth-success', onAuthSuccess);
      reject(new Error('Authentication timeout'));
    }, 5000);

    const onAuthSuccess = (data: { userId: string; isAdmin: boolean }) => {
      clearTimeout(timeoutId);
      console.log(`✅ Socket authenticated: ${data.userId} (Admin: ${data.isAdmin})`);
      resolve(true);
    };

    socketInstance.once('auth-success', onAuthSuccess);
    socketInstance.emit('auth', { userId, userRole });
  });
};

// Check if socket is connected
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

// Get devices list via Socket.IO
export const getDevicesViaSocket = (userId: string, isAdmin: boolean = false): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const socketInstance = getSocket();
    
    // Enhanced connection validation
    if (!socketInstance.connected) {
      console.error('❌ Socket not connected for get-devices request');
      console.log('🔍 Socket state:', {
        connected: socketInstance.connected,
        disconnected: socketInstance.disconnected,
        id: socketInstance.id,
        transport: socketInstance.io.engine?.transport?.name
      });
      reject(new Error('Socket.IO not connected'));
      return;
    }

    console.log(`📤 Requesting devices for user: ${userId} (Admin: ${isAdmin})`);
    console.log(`🔗 Socket state at request: ID=${socketInstance.id}, Connected=${socketInstance.connected}`);

    // Create unique request ID and event names to avoid conflicts
    const requestId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const responseEvent = `devices-list-${requestId}`;
    const errorEvent = `devices-error-${requestId}`;
    
    console.log(`🆔 Request ID: ${requestId}`);
    console.log(`📡 Response event: ${responseEvent}`);

    const timeoutId = setTimeout(() => {
      console.error(`⏰ get-devices request timeout after 15 seconds (Request ID: ${requestId})`);
      console.log(`🔍 Socket state at timeout: ID=${socketInstance.id}, Connected=${socketInstance.connected}`);
      socketInstance.off(responseEvent, onDevicesList);
      socketInstance.off(errorEvent, onDevicesError);
      reject(new Error('Request timeout - server may be busy'));
    }, 15000);

    const onDevicesList = (devices: any[]) => {
      console.log(`📥 Received devices response: ${devices?.length || 0} devices for request ${requestId}`);
      clearTimeout(timeoutId);
      socketInstance.off(errorEvent, onDevicesError);
      resolve(devices);
    };

    const onDevicesError = (error: { message: string }) => {
      console.error(`❌ Devices request error for ${requestId}:`, error);
      clearTimeout(timeoutId);
      socketInstance.off(responseEvent, onDevicesList);
      reject(new Error(error.message));
    };

    // Setup unique listeners for this request - using once() since they're unique
    socketInstance.once(responseEvent, onDevicesList);
    socketInstance.once(errorEvent, onDevicesError);

    // Double-check connection before sending
    if (!socketInstance.connected) {
      console.error(`❌ Socket disconnected between setup and emit! Request ID: ${requestId}`);
      clearTimeout(timeoutId);
      socketInstance.off(responseEvent, onDevicesList);
      socketInstance.off(errorEvent, onDevicesError);
      reject(new Error('Socket disconnected during request setup'));
      return;
    }

    // Send request with admin flag and request ID
    console.log(`📡 Emitting get-devices for request ID: ${requestId}`);
    socketInstance.emit('get-devices', { userId, isAdmin, requestId });
    console.log(`✅ get-devices request sent for user: ${userId} with ID: ${requestId}`);
  });
};

// Send shutdown command via Socket.IO
export const sendShutdownCommand = (userId: string, macAddress: string, isAdmin: boolean = false): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve, reject) => {
    const socketInstance = getSocket();
    
    if (!socketInstance.connected) {
      reject(new Error('Socket.IO not connected'));
      return;
    }

    const requestId = `${macAddress}-${Date.now()}`;
    console.log(`🆔 Shutdown Request ID: ${requestId}`);

    const timeoutId = setTimeout(() => {
      console.error(`⏰ Shutdown request timeout for ${macAddress} (Request ID: ${requestId})`);
      socketInstance.off('shutdown-response', onShutdownResponse);
      reject(new Error('Shutdown request timeout'));
    }, 10000);

    // Setup listener for response with proper cleanup
    const onShutdownResponse = (response: { success: boolean; message: string; macAddress: string }) => {
      if (response.macAddress === macAddress) {
        console.log(`📥 Shutdown response received for ${macAddress} (Request ID: ${requestId})`);
        clearTimeout(timeoutId);
        socketInstance.off('shutdown-response', onShutdownResponse);
        resolve(response);
      }
    };

    socketInstance.on('shutdown-response', onShutdownResponse);

    // Send shutdown request
    socketInstance.emit('shutdown-request', { userId, macAddress, isAdmin });
  });
};

// Setup device event listeners using the manager
export const setupDeviceListeners = (
  componentId: string,
  callbacks: {
    onDeviceUpdate?: (device: any) => void;
    onDeviceDisconnect?: (macAddress: string) => void;
    onDeviceShutdown?: (macAddress: string) => void;
    onReconnect?: () => void;
  }
) => {
  console.log(`🎯 [setupDeviceListeners] Called for component: ${componentId}`);
  
  // Initialize socket if not already done
  const socketInstance = getSocket();
  console.log(`🔗 [setupDeviceListeners] Socket instance created/retrieved:`, socketInstance?.id);
  
  // Register with the manager
  const manager = SocketManager.getInstance();
  console.log(`📦 [setupDeviceListeners] Registering with manager...`);
  manager.registerComponent(componentId, callbacks);
  
  console.log(`✅ [setupDeviceListeners] Setup complete for: ${componentId}`);
};

// Cleanup device listeners for a specific component
export const cleanupDeviceListeners = (componentId: string) => {
  const manager = SocketManager.getInstance();
  manager.unregisterComponent(componentId);
};

// Get debug info
export const getSocketDebugInfo = () => {
  const manager = SocketManager.getInstance();
  return {
    connected: isSocketConnected(),
    socketId: socket?.id,
    activeComponents: manager.getActiveComponents(),
    componentCount: manager.getActiveComponents().length,
    socketUrl: SOCKET_URL,
    socketInstance: socket
  };
};

// Test function for manual debugging in browser console
export const testSocketConnection = () => {
  console.log('🧪 [TEST] Testing socket connection...');
  console.log('Socket URL:', SOCKET_URL);
  console.log('Socket instance:', socket);
  console.log('Socket connected:', socket?.connected);
  console.log('Socket ID:', socket?.id);
  
  if (socket) {
    // Test emit
    socket.emit('test-from-client', { message: 'Hello from client' });
    
    // Setup test listener
    socket.on('test-response', (data) => {
      console.log('🎉 [TEST] Received test response:', data);
    });
    
    // Manual device-update listener
    socket.on('device-update', (data) => {
      console.log('🎉 [TEST] Manual device-update received:', data);
    });
  }
  
  return {
    socketUrl: SOCKET_URL,
    connected: socket?.connected,
    socketId: socket?.id
  };
};

// Global access for debugging
if (process.client) {
  (window as any).testSocketConnection = testSocketConnection;
  (window as any).getSocketDebugInfo = getSocketDebugInfo;
}

// Legacy exports for backward compatibility (deprecated)
export { getSocket as socket }; 
