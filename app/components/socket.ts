import { io } from "socket.io-client";

// Create socket client instance with reconnection options
export const socket = io({
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// Log socket connection events for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

// Function to send shutdown command to server
export const sendShutdownCommand = (userId: string, macAddress: string) => {
  return new Promise<{ success: boolean; message: string }>((resolve) => {
    socket.emit('shutdown-request', { userId, macAddress });

    // Timeout after 10 seconds if no response
    const timeout = setTimeout(() => {
      resolve({ success: false, message: 'Request timed out' });
    }, 10000);

    // Listen for response from server
    socket.once('shutdown-response', (response: { success: boolean; message: string }) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}; 
