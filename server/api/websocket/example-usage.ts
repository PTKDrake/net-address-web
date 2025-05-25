// Ví dụ sử dụng WebSocket Message Validator
// File này chỉ để minh họa, không được sử dụng trong production

import type { Peer } from "crossws";
import { WebSocketMessageValidator } from './validators';

// Khởi tạo
const computerConnections = new Map<string, Peer>();
const messageValidator = new WebSocketMessageValidator(computerConnections);

// Ví dụ các message hợp lệ
const exampleMessages = {
  // Đăng ký thiết bị mới với thông tin phần cứng đầy đủ
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

  // Kiểm tra thiết bị tồn tại
  exists: {
    messageType: "exists",
    macAddress: "00:11:22:33:44:55"
  },

  // Cập nhật thông tin thiết bị với hardware mới
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
        usage: 45.2 // CPU usage đã thay đổi
      },
      memory: {
        total: 32,
        used: 20.1, // Memory usage đã thay đổi
        available: 11.9,
        usage: 62.8
      },
      storage: {
        total: 1000,
        used: 475, // Storage đã thay đổi
        available: 525,
        usage: 47.5
      }
    }
  },

  // Ngắt kết nối thiết bị
  disconnect: {
    messageType: "disconnect",
    macAddress: "00:11:22:33:44:55"
  },

  // Tắt thiết bị
  shutdown: {
    messageType: "shutdown",
    macAddress: "00:11:22:33:44:55"
  }
};

// Ví dụ các message không hợp lệ
const invalidMessages = {
  // Thiếu messageType
  noMessageType: {
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.100"
  },

  // messageType không hợp lệ
  invalidMessageType: {
    messageType: "invalid",
    macAddress: "00:11:22:33:44:55"
  },

  // Thiếu dữ liệu bắt buộc
  missingData: {
    messageType: "register",
    // Thiếu macAddress, ipAddress, machineName
  },

  // Dữ liệu rỗng
  emptyData: {
    messageType: "register",
    macAddress: "",
    ipAddress: "",
    machineName: ""
  },

  // Hardware data không hợp lệ
  invalidHardware: {
    messageType: "register",
    userId: "user123",
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.100",
    machineName: "Test PC",
    hardware: {
      cpu: {
        model: "Intel i7",
        cores: "invalid", // Phải là number
        speed: 3.6
      }
    }
  }
};

// Hàm mô phỏng xử lý message
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

// Mock peer object để test
const mockPeer = {
  send: (data: any) => {
    console.log('📤 Response sent:', typeof data === 'string' ? data : JSON.stringify(data));
  }
} as Peer;

// Hàm chạy ví dụ
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

// Uncomment để chạy ví dụ
// runExamples(); 