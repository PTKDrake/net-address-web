# BÁO CÁO DỰ ÁN: HỆ THỐNG QUẢN LÝ THIẾT BỊ TỪ XA
## Remote Device Management System

**Môn học:** Lập trình mạng  
**Sinh viên:** [Tên sinh viên]  
**Mã số sinh viên:** [MSSV]  
**Ngày báo cáo:** [Ngày/Tháng/Năm]

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả dự án
Hệ thống quản lý thiết bị từ xa (Remote Device Management System) là một ứng dụng web cho phép quản lý và giám sát các thiết bị máy tính từ xa thông qua kết nối mạng. Hệ thống cung cấp khả năng:

- **Real-time monitoring**: Giám sát thiết bị theo thời gian thực
- **Hardware information tracking**: Thu thập thông tin phần cứng chi tiết
- **Remote control**: Điều khiển thiết bị từ xa (shutdown, disconnect)
- **User authentication**: Xác thực và phân quyền người dùng
- **Device registration**: Đăng ký và quản lý thiết bị

### 1.2 Kiến trúc hệ thống
```
[Client Devices] ←→ [WebSocket Server] ←→ [Web Application] ←→ [Database]
                          ↕
                   [Socket.IO Server]
                          ↕
                   [Web Browser Client]
```

---

## 2. CÔNG NGHỆ VÀ GIAO THỨC MẠNG SỬ DỤNG

### 2.1 Giao thức mạng chính

#### 2.1.1 HTTP/HTTPS Protocol
- **Mục đích**: Giao tiếp RESTful API giữa web client và server
- **Port**: 80 (HTTP), 443 (HTTPS)
- **Methods sử dụng**:
  - `GET`: Lấy danh sách thiết bị, thông tin người dùng
  - `POST`: Đăng ký thiết bị, xác thực người dùng, gửi lệnh shutdown
  - `PUT`: Cập nhật thông tin thiết bị
  - `DELETE`: Xóa thiết bị

#### 2.1.2 WebSocket Protocol (RFC 6455)
- **Mục đích**: Kết nối persistent full-duplex giữa client devices và server
- **Port**: 80/443 (upgrade từ HTTP)
- **Đặc điểm**:
  - Persistent connection: Duy trì kết nối liên tục
  - Low latency: Độ trễ thấp cho real-time communication
  - Bidirectional: Giao tiếp hai chiều

#### 2.1.3 Socket.IO Protocol
- **Mục đích**: Real-time communication giữa web browser và server
- **Transport methods**:
  - WebSocket (primary)
  - HTTP long-polling (fallback)
  - HTTP short-polling (fallback)
- **Features**:
  - Auto-reconnection
  - Room management
  - Event-based communication

### 2.2 Giao thức tầng thấp

#### 2.2.1 TCP (Transmission Control Protocol)
- **Vai trò**: Transport layer protocol cho WebSocket và HTTP
- **Đặc điểm**:
  - Reliable delivery: Đảm bảo gửi tin cậy
  - Connection-oriented: Thiết lập kết nối trước khi truyền
  - Flow control: Kiểm soát luồng dữ liệu
  - Error detection và correction

#### 2.2.2 IP (Internet Protocol)
- **Version**: IPv4 và IPv6
- **Vai trò**: Network layer routing
- **Addressing**: Định danh thiết bị qua IP address

---

## 3. CẤU TRÚC DỮ LIỆU VÀ ĐÓNG GÓI

### 3.1 WebSocket Message Format

#### 3.1.1 Device Registration Message
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

#### 3.1.2 Device Update Message
```json
{
  "messageType": "update",
  "macAddress": "00:11:22:33:44:55",
  "ipAddress": "192.168.1.101",
  "machineName": "Updated Computer Name",
  "hardware": {
    // Hardware information với các metrics được cập nhật
  }
}
```

#### 3.1.3 Control Commands
```json
{
  "messageType": "shutdown",
  "macAddress": "00:11:22:33:44:55"
}
```

### 3.2 Socket.IO Events

#### 3.2.1 Client to Server Events
- `register-device`: Đăng ký thiết bị mới
- `shutdown-request`: Yêu cầu tắt thiết bị
- `disconnect`: Ngắt kết nối

#### 3.2.2 Server to Client Events
- `device-update`: Cập nhật thông tin thiết bị
- `device-disconnect`: Thiết bị ngắt kết nối
- `device-shutdown`: Thiết bị được tắt
- `shutdown-command`: Lệnh tắt máy gửi đến thiết bị

### 3.3 HTTP API Endpoints

#### 3.3.1 Device Management
```
GET    /api/devices          - Lấy danh sách thiết bị
POST   /api/devices/shutdown - Gửi lệnh tắt thiết bị
PUT    /api/devices/:id      - Cập nhật thiết bị
DELETE /api/devices/:id      - Xóa thiết bị
```

#### 3.3.2 Authentication
```
POST   /api/auth/signin      - Đăng nhập
POST   /api/auth/signup      - Đăng ký
POST   /api/auth/signout     - Đăng xuất
POST   /api/auth/verify      - Xác thực email
```

---

## 4. QUÁ TRÌNH ĐÓNG GÓI VÀ TRUYỀN DỮ LIỆU

### 4.1 WebSocket Data Flow

#### 4.1.1 Connection Establishment
```
1. HTTP Handshake Request:
   GET /websocket HTTP/1.1
   Host: localhost:3000
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: [base64-encoded-key]
   Sec-WebSocket-Version: 13

2. HTTP Handshake Response:
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: [calculated-accept-key]

3. WebSocket Connection Established
```

#### 4.1.2 Data Frame Structure
```
WebSocket Frame Format (RFC 6455):
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

### 4.2 Message Validation và Processing

#### 4.2.1 Zod Schema Validation
```typescript
const RegisterSchema = z.object({
  messageType: z.literal("register"),
  userId: z.string().optional(),
  macAddress: z.string().min(1, "MAC address is required"),
  ipAddress: z.string().min(1, "IP address is required"),
  machineName: z.string().min(1, "Machine name is required"),
  hardware: HardwareSchema
});
```

#### 4.2.2 Message Processing Flow
```
Client Device → WebSocket Frame → JSON Parse → Schema Validation → 
Message Processor → Database Update → Broadcast Event → 
Socket.IO → Web Client Update
```

### 4.3 Database Storage

#### 4.3.1 Device Schema
```sql
CREATE TABLE devices (
  mac_address VARCHAR(17) UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id),
  name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  is_connected BOOLEAN DEFAULT FALSE NOT NULL,
  hardware JSONB,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.3.2 Hardware Information Structure
```json
{
  "cpu": { "model": "string", "cores": "number", "speed": "number", "usage": "number" },
  "memory": { "total": "number", "used": "number", "available": "number", "usage": "number" },
  "storage": { "total": "number", "used": "number", "available": "number", "usage": "number" },
  "gpu": { "model": "string", "memory": "number", "usage": "number" },
  "network": { "interfaces": "array" },
  "os": { "name": "string", "version": "string", "architecture": "string", "uptime": "number" },
  "motherboard": { "manufacturer": "string", "model": "string" }
}
```

---

## 5. BẢO MẬT VÀ XÁC THỰC

### 5.1 Authentication Flow
```
1. User Registration/Login → Better-Auth
2. JWT Token Generation
3. Session Management
4. Device Registration với User ID
5. MAC Address Validation
```

### 5.2 Security Measures
- **HTTPS**: Mã hóa dữ liệu truyền tải
- **JWT Tokens**: Xác thực stateless
- **Input Validation**: Zod schema validation
- **CORS**: Cross-Origin Resource Sharing control
- **Rate Limiting**: Giới hạn request frequency

---

## 6. HIỆU NĂNG VÀ TỐI ƯU HÓA

### 6.1 WebSocket Optimizations
- **Connection Pooling**: Quản lý kết nối hiệu quả
- **Message Compression**: Nén dữ liệu trước khi gửi
- **Heartbeat Mechanism**: Kiểm tra kết nối định kỳ
- **Automatic Reconnection**: Tự động kết nối lại khi mất kết nối

### 6.2 Database Optimizations
- **Indexing**: Index trên MAC address và user ID
- **JSON Fields**: Sử dụng JSONB cho hardware information
- **Connection Pooling**: Drizzle ORM connection management

### 6.3 Frontend Optimizations
- **SSR/SSG**: Server-Side Rendering với Nuxt.js
- **Code Splitting**: Lazy loading components
- **Caching**: Browser và server-side caching
- **Compression**: Gzip/Brotli compression

---

## 7. TESTING VÀ DEBUGGING

### 7.1 WebSocket Testing
```javascript
// Example WebSocket client test
const ws = new WebSocket('ws://localhost:3000/websocket');

ws.onopen = () => {
  ws.send(JSON.stringify({
    messageType: "register",
    userId: "test-user",
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.100",
    machineName: "Test Machine"
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

### 7.2 Error Handling
- **Connection Errors**: Retry mechanisms
- **Validation Errors**: Zod error reporting
- **Network Timeouts**: Timeout handling
- **Database Errors**: Transaction rollback

---

## 8. DEPLOYMENT VÀ PRODUCTION

### 8.1 Production Architecture
```
[Load Balancer] → [Nginx Reverse Proxy] → [Nuxt.js Application]
                                              ↓
[WebSocket Gateway] ← [Socket.IO Cluster] ← [Application Server]
                                              ↓
                                        [PostgreSQL Database]
```

### 8.2 Scalability Considerations
- **Horizontal Scaling**: Multiple application instances
- **Database Replication**: Master-slave configuration
- **WebSocket Scaling**: Socket.IO Redis adapter
- **CDN**: Static asset delivery

---

## 9. KẾT LUẬN

### 9.1 Kết quả đạt được
- Xây dựng thành công hệ thống quản lý thiết bị từ xa
- Triển khai WebSocket real-time communication
- Tích hợp Socket.IO cho web browser communication
- Xử lý hardware information collection và display
- Implement authentication và authorization

### 9.2 Kiến thức thu được
- **Network Protocols**: HTTP/HTTPS, WebSocket, TCP/IP
- **Real-time Communication**: Socket.IO, WebSocket APIs
- **Data Serialization**: JSON, Schema validation
- **Database Design**: Relational và JSON data storage
- **Security**: Authentication, authorization, data validation

### 9.3 Hướng phát triển
- Implement SSL/TLS certificates
- Add monitoring và logging systems
- Enhance security với rate limiting
- Optimize performance với caching strategies
- Add mobile application support

---

## 10. TÀI LIỆU THAM KHẢO

1. **RFC 6455** - The WebSocket Protocol
2. **Socket.IO Documentation** - https://socket.io/docs/
3. **Nuxt.js Documentation** - https://nuxt.com/
4. **Better-Auth Documentation** - https://better-auth.com/
5. **Drizzle ORM Documentation** - https://orm.drizzle.team/
6. **PostgreSQL Documentation** - https://postgresql.org/docs/
7. **HTTP/1.1 Specification** - RFC 7230-7237
8. **TCP/IP Illustrated** - Richard Stevens

---

**Ngày hoàn thành:** [Ngày/Tháng/Năm]  
**Chữ ký sinh viên:** _______________ 