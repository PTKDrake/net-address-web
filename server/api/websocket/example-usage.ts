// WebSocket Message Validator Usage Examples
// This file is for demonstration only, not for production use

import type { Peer } from "crossws";
import { WebSocketMessageValidator } from './validators';

// Initialize
const computerConnections = new Map<string, Peer>();
const messageValidator = new WebSocketMessageValidator(computerConnections);

// Valid message examples
const exampleMessages = {
  // Register new device with complete hardware information
  register: {
    messageType: "register",
    userId: "user123",
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.100",
    machineName: "My Gaming PC",
    hardware: {
      cpu: {
        model: "Intel Core i7-12700K",
        cores: 12,
        speed: 3.6,
        usage: 25.5
      },
      memory: {
        total: 32,
        used: 16.5,
        available: 15.5,
        usage: 51.6
      },
      storage: {
        total: 1000,
        used: 450,
        available: 550,
        usage: 45.0
      },
      gpu: {
        model: "NVIDIA RTX 4070",
        memory: 12,
        usage: 15.2
      },
      network: {
        interfaces: [
          {
            name: "Ethernet",
            type: "ethernet",
            speed: 1000
          },
          {
            name: "Wi-Fi 6",
            type: "wifi",
            speed: 300
          }
        ]
      },
      os: {
        name: "Windows",
        version: "11",
        architecture: "x64",
        uptime: 86400
      },
      motherboard: {
        manufacturer: "ASUS",
        model: "ROG STRIX Z690-E"
      }
    }
  },

  // Check if device exists
  exists: {
    messageType: "exists",
    macAddress: "00:11:22:33:44:55"
  },

  // Update device information with new hardware
  update: {
    messageType: "update",
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.101",
    machineName: "Updated Gaming PC",
    hardware: {
      cpu: {
        model: "Intel Core i7-12700K",
        cores: 12,
        speed: 3.6,
        usage: 45.2 // CPU usage has changed
      },
      memory: {
        total: 32,
        used: 20.1, // Memory usage has changed
        available: 11.9,
        usage: 62.8
      },
      storage: {
        total: 1000,
        used: 475, // Storage has changed
        available: 525,
        usage: 47.5
      }
    }
  },

  // Disconnect device
  disconnect: {
    messageType: "disconnect",
    macAddress: "00:11:22:33:44:55"
  },

  // Shutdown device
  shutdown: {
    messageType: "shutdown",
    macAddress: "00:11:22:33:44:55"
  }
};

// Invalid message examples
const invalidMessages = {
  // Missing messageType
  noMessageType: {
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.100"
  },

  // Invalid messageType
  invalidMessageType: {
    messageType: "invalid",
    macAddress: "00:11:22:33:44:55"
  },

  // Missing required data
  missingData: {
    messageType: "register",
    // Missing macAddress, ipAddress, machineName
  },

  // Empty data
  emptyData: {
    messageType: "register",
    macAddress: "",
    ipAddress: "",
    machineName: ""
  },

  // Invalid hardware data
  invalidHardware: {
    messageType: "register",
    userId: "user123",
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.100",
    machineName: "Test PC",
    hardware: {
      cpu: {
        model: "Intel i7",
        cores: "invalid", // Must be number
        speed: 3.6
      }
    }
  }
};

// Function to simulate message processing
async function simulateMessageProcessing(message: any, mockPeer: any) {
  console.log('Processing message:', JSON.stringify(message, null, 2));
  
  try {
    await messageValidator.validateAndProcess(message, mockPeer);
    console.log('✅ Message processed successfully');
  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
  
  console.log('---');
}

// Mock peer object for testing
const mockPeer = {
  send: (data: any) => {
    console.log('📤 Response sent:', typeof data === 'string' ? data : JSON.stringify(data));
  }
} as Peer;

// Function to run examples
export async function runExamples() {
  console.log('🚀 WebSocket Message Validator Examples\n');

  console.log('📋 Valid Messages:');
  for (const [name, message] of Object.entries(exampleMessages)) {
    console.log(`\n${name.toUpperCase()} Message:`);
    await simulateMessageProcessing(message, mockPeer);
  }

  console.log('\n❌ Invalid Messages:');
  for (const [name, message] of Object.entries(invalidMessages)) {
    console.log(`\n${name.toUpperCase()} Message:`);
    await simulateMessageProcessing(message, mockPeer);
  }
}

// Uncomment to run examples
// runExamples(); 