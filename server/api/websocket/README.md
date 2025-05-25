# WebSocket Message Validator

Hệ thống validator này được thiết kế để xử lý và validate các message WebSocket một cách có cấu trúc và an toàn, bao gồm thông tin phần cứng chi tiết.

## Cấu trúc

### 1. Schemas (Zod Validation)
Mỗi loại message có schema riêng để validate:
- `RegisterSchema`: Đăng ký thiết bị mới với thông tin phần cứng
- `ExistsSchema`: Kiểm tra thiết bị có tồn tại không
- `UpdateSchema`: Cập nhật thông tin thiết bị và phần cứng
- `DisconnectSchema`: Ngắt kết nối thiết bị
- `ShutdownSchema`: Tắt thiết bị

### 2. Hardware Information Schema
Hệ thống hỗ trợ thu thập thông tin phần cứng chi tiết:
- **CPU**: Model, số cores, tốc độ, usage
- **Memory**: Tổng dung lượng, đã sử dụng, còn trống, usage
- **Storage**: Tổng dung lượng, đã sử dụng, còn trống, usage
- **GPU**: Model, memory, usage
- **Network**: Danh sách interfaces với tên, loại, tốc độ
- **OS**: Tên, phiên bản, kiến trúc, uptime
- **Motherboard**: Nhà sản xuất, model

### 3. Message Processors (Classes)
Mỗi loại message có class processor riêng:

#### `RegisterProcessor`
- **Mục đích**: Đăng ký thiết bị mới hoặc cập nhật thiết bị đã tồn tại
- **Dữ liệu cần thiết**: `userId` (cho thiết bị mới), `macAddress`, `ipAddress`, `machineName`, `hardware` (optional)
- **Xử lý**: 
  - Kiểm tra thiết bị đã tồn tại chưa
  - Nếu chưa tồn tại: tạo mới (cần userId)
  - Nếu đã tồn tại: cập nhật thông tin và hardware
  - Broadcast update đến tất cả clients

#### `ExistsProcessor`
- **Mục đích**: Kiểm tra thiết bị có tồn tại trong database không
- **Dữ liệu cần thiết**: `macAddress`
- **Xử lý**: Trả về thông tin thiết bị nếu tồn tại

#### `UpdateProcessor`
- **Mục đích**: Cập nhật thông tin thiết bị đã tồn tại
- **Dữ liệu cần thiết**: `macAddress`, `ipAddress`, `machineName`, `hardware` (optional)
- **Xử lý**: Cập nhật database với thông tin mới và broadcast update

#### `DisconnectProcessor`
- **Mục đích**: Xử lý ngắt kết nối thiết bị
- **Dữ liệu cần thiết**: `macAddress`
- **Xử lý**: Cập nhật trạng thái offline và broadcast disconnect

#### `ShutdownProcessor`
- **Mục đích**: Xử lý tắt thiết bị
- **Dữ liệu cần thiết**: `macAddress`
- **Xử lý**: Cập nhật trạng thái offline và broadcast shutdown

### 4. Main Validator Class
`WebSocketMessageValidator` là class chính để:
- Validate message format
- Phân loại message type
- Gọi processor tương ứng
- Xử lý lỗi validation

## Cách sử dụng

```typescript
// Khởi tạo validator
const computerConnections = new Map<string, Peer>();
const messageValidator = new WebSocketMessageValidator(computerConnections);

// Xử lý message
await messageValidator.validateAndProcess(messageData, peer);
```

## Các loại message được hỗ trợ

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
    // Hardware object tương tự như register message
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
- `{"messageType": "info", "message": "registered"}` - Thiết bị đã được đăng ký
- `{"messageType": "info", "message": "updated"}` - Thiết bị đã được cập nhật
- `{"messageType": "info", "message": "connected"}` - Thiết bị đã kết nối lại
- `{"messageType": "info", "message": "disconnected"}` - Thiết bị đã ngắt kết nối
- `{"messageType": "exists", "message": "..."}` - Thông tin tồn tại của thiết bị

### Error Responses
- `{"messageType": "error", "message": "Invalid message format: messageType is required"}`
- `{"messageType": "error", "message": "Invalid register message: ..."}`
- `{"messageType": "error", "message": "userId required for new device registration"}`
- `{"messageType": "error", "message": "Unknown message type: ..."}`

## Hardware Information Display

Giao diện web sẽ hiển thị thông tin phần cứng một cách trực quan:
- **CPU**: Model, số cores, tốc độ và usage
- **Memory**: Dung lượng đã sử dụng/tổng dung lượng với phần trăm
- **Storage**: Dung lượng đã sử dụng/tổng dung lượng với phần trăm
- **GPU**: Model và thông tin memory
- **OS**: Hệ điều hành, phiên bản và kiến trúc
- **Uptime**: Thời gian hoạt động được format dễ đọc (ngày, giờ, phút)

## Lợi ích

1. **Type Safety**: Sử dụng Zod để validate dữ liệu đầu vào
2. **Hardware Monitoring**: Thu thập và hiển thị thông tin phần cứng chi tiết
3. **Modularity**: Mỗi loại message có processor riêng
4. **Error Handling**: Xử lý lỗi chi tiết và trả về message rõ ràng
5. **Maintainability**: Dễ dàng thêm loại message mới
6. **Consistency**: Cấu trúc response nhất quán
7. **Real-time Updates**: Cập nhật thông tin phần cứng theo thời gian thực
8. **Logging**: Log chi tiết cho debugging 