# WebSocket Message Validator

This validator system is designed to handle and validate WebSocket messages in a structured and secure way, including detailed hardware information.

## Structure

### 1. Schemas (Zod Validation)
Each message type has its own schema for validation:
- `RegisterSchema`: Register new device with hardware information
- `ExistsSchema`: Check if device exists
- `UpdateSchema`: Update device and hardware information
- `DisconnectSchema`: Disconnect device
- `ShutdownSchema`: Shutdown device

### 2. Hardware Information Schema
The system supports collecting detailed hardware information:
- **CPU**: Model, cores, speed, usage
- **Memory**: Total capacity, used, available, usage
- **Storage**: Total capacity, used, available, usage
- **GPU**: Model, memory, usage
- **Network**: List of interfaces with name, type, speed
- **OS**: Name, version, architecture, uptime
- **Motherboard**: Manufacturer, model

### 3. Message Processors (Classes)
Each message type has its own processor class:

#### `RegisterProcessor`
- **Purpose**: Register new device or update existing device
- **Required data**: `userId` (for new devices), `macAddress`, `ipAddress`, `machineName`, `hardware` (optional)
- **Processing**: 
  - Check if device already exists
  - If not exists: create new (requires userId)
  - If exists: update information and hardware
  - Broadcast update to all clients

#### `ExistsProcessor`
- **Purpose**: Check if device exists in database
- **Required data**: `macAddress`
- **Processing**: Return device information if exists

#### `UpdateProcessor`
- **Purpose**: Update existing device information
- **Required data**: `macAddress`, `ipAddress`, `machineName`, `hardware` (optional)
- **Processing**: Update database with new information and broadcast update

#### `DisconnectProcessor`
- **Purpose**: Handle device disconnection
- **Required data**: `macAddress`
- **Processing**: Update offline status and broadcast disconnect

#### `ShutdownProcessor`
- **Purpose**: Handle device shutdown
- **Required data**: `macAddress`
- **Processing**: Update offline status and broadcast shutdown

### 4. Main Validator Class
`WebSocketMessageValidator` is the main class to:
- Validate message format
- Classify message type
- Call corresponding processor
- Handle validation errors

## Usage

```typescript
// Initialize validator
const computerConnections = new Map<string, Peer>();
const messageValidator = new WebSocketMessageValidator(computerConnections);

// Process message
await messageValidator.validateAndProcess(messageData, peer);
```

## Supported Message Types

### 1. Register Message
```json
{
  "messageType": "register",
  "userId": "user123",
  "macAddress": "00:11:22:33:44:55",
  "ipAddress": "192.168.1.100",
  "machineName": "My Computer",
  "hardware": {
    "cpu": {
      "model": "Intel Core i7-12700K",
      "cores": 12,
      "speed": 3.6,
      "usage": 25.5
    },
    "memory": {
      "total": 32,
      "used": 16.5,
      "available": 15.5,
      "usage": 51.6
    },
    "storage": {
      "total": 1000,
      "used": 450,
      "available": 550,
      "usage": 45.0
    },
    "gpu": {
      "model": "NVIDIA RTX 4070",
      "memory": 12,
      "usage": 15.2
    },
    "network": {
      "interfaces": [
        {
          "name": "Ethernet",
          "type": "ethernet",
          "speed": 1000
        },
        {
          "name": "Wi-Fi",
          "type": "wifi",
          "speed": 300
        }
      ]
    },
    "os": {
      "name": "Windows",
      "version": "11",
      "architecture": "x64",
      "uptime": 86400
    },
    "motherboard": {
      "manufacturer": "ASUS",
      "model": "ROG STRIX Z690-E"
    }
  }
}
```

### 2. Exists Message
```json
{
  "messageType": "exists",
  "macAddress": "00:11:22:33:44:55"
}
```

### 3. Update Message
```json
{
  "messageType": "update",
  "macAddress": "00:11:22:33:44:55",
  "ipAddress": "192.168.1.101",
  "machineName": "Updated Computer Name",
  "hardware": {
    // Hardware object similar to register message
  }
}
```

### 4. Disconnect Message
```json
{
  "messageType": "disconnect",
  "macAddress": "00:11:22:33:44:55"
}
```

### 5. Shutdown Message
```json
{
  "messageType": "shutdown",
  "macAddress": "00:11:22:33:44:55"
}
```

## Responses

### Success Responses
- `{"messageType": "info", "message": "registered"}` - Device has been registered
- `{"messageType": "info", "message": "updated"}` - Device has been updated
- `{"messageType": "info", "message": "connected"}` - Device has reconnected
- `{"messageType": "info", "message": "disconnected"}` - Device has disconnected
- `{"messageType": "exists", "message": "..."}` - Device existence information

### Error Responses
- `{"messageType": "error", "message": "Invalid message format: messageType is required"}`
- `{"messageType": "error", "message": "Invalid register message: ..."}`
- `{"messageType": "error", "message": "userId required for new device registration"}`
- `{"messageType": "error", "message": "Unknown message type: ..."}`

## Hardware Information Display

The web interface will display hardware information visually:
- **CPU**: Model, cores, speed and usage
- **Memory**: Used/total capacity with percentage
- **Storage**: Used/total capacity with percentage
- **GPU**: Model and memory information
- **OS**: Operating system, version and architecture
- **Uptime**: Runtime formatted in readable format (days, hours, minutes)

## Benefits

1. **Type Safety**: Use Zod to validate input data
2. **Hardware Monitoring**: Collect and display detailed hardware information
3. **Modularity**: Each message type has its own processor
4. **Error Handling**: Detailed error handling and clear message returns
5. **Maintainability**: Easy to add new message types
6. **Consistency**: Consistent response structure
7. **Real-time Updates**: Update hardware information in real-time
8. **Logging**: Detailed logging for debugging 