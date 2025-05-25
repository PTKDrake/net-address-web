# BÁO CÁO DỰ ÁN: HỆ THỐNG QUẢN LÝ THIẾT BỊ TỪ XA
## Remote Device Management System với Admin Dashboard

**Môn học:** Lập trình mạng  
**Sinh viên:** [Tên sinh viên]  
**Mã số sinh viên:** [MSSV]  
**Ngày báo cáo:** [Ngày/Tháng/Năm]

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả dự án
Hệ thống quản lý thiết bị từ xa (Remote Device Management System) là một ứng dụng web full-stack cho phép quản lý và giám sát các thiết bị máy tính từ xa thông qua kết nối mạng. Hệ thống được xây dựng với NuxtJS 4 và cung cấp hai mức quyền truy cập khác nhau:

**Tính năng chính:**
- **Real-time monitoring**: Giám sát thiết bị theo thời gian thực với Socket.IO
- **Hardware information tracking**: Thu thập thông tin phần cứng chi tiết (CPU, RAM, Storage, GPU, Network, OS, Motherboard)
- **Remote control**: Điều khiển thiết bị từ xa (shutdown commands)
- **Multi-user authentication**: Xác thực và phân quyền người dùng với Better Auth
- **Admin dashboard**: Quản trị viên có thể xem và quản lý thiết bị của tất cả người dùng
- **User filtering**: Admin có thể lọc thiết bị theo từng người dùng cụ thể
- **Device registration**: Đăng ký và quản lý thiết bị tự động qua WebSocket

### 1.2 Kiến trúc hệ thống
```
[Client Devices] ←→ [WebSocket Server] ←→ [NuxtJS 4 Application] ←→ [PostgreSQL + Drizzle ORM]
                          ↕                        ↕
                   [Socket.IO Server] ←→ [Better Auth Session]
                          ↕                        ↕
                   [Web Browser Client]    [Admin Dashboard]
```

### 1.3 Phân quyền người dùng
- **Regular User**: Chỉ có thể xem và quản lý thiết bị của chính mình
- **Admin User**: 
  - Xem tất cả thiết bị của toàn bộ người dùng
  - Lọc thiết bị theo người dùng cụ thể
  - Shutdown bất kỳ thiết bị nào
  - Truy cập admin dashboard tại `/admin/devices`

### 1.4 Tech Stack
- **Frontend**: NuxtJS 4, @nuxt/ui, Tailwind CSS, TypeScript
- **Backend**: Better Auth, Drizzle ORM, Socket.IO, WebSocket
- **Database**: PostgreSQL với JSONB support
- **Package Manager**: pnpm
- **Authentication**: Google OAuth, Email/Password với Better Auth

---

## 2. CÔNG NGHỆ VÀ GIAO THỨC MẠNG SỬ DỤNG

### 2.1 Giao thức mạng chính

#### 2.1.1 HTTP/HTTPS Protocol
- **Mục đích**: Giao tiếp RESTful API giữa NuxtJS client và server
- **Port**: 3000 (Development), 80/443 (Production)
- **Framework**: NuxtJS 4 với Server Routes
- **Methods sử dụng**:
  - `GET`: Lấy danh sách thiết bị (với phân quyền admin/user), thông tin người dùng
  - `POST`: Đăng ký thiết bị, xác thực người dùng, gửi lệnh shutdown, debug events
  - `PUT`: Cập nhật thông tin thiết bị
  - `DELETE`: Xóa thiết bị

#### 2.1.2 WebSocket Protocol (RFC 6455)
- **Mục đích**: Kết nối persistent full-duplex giữa client devices và NuxtJS server
- **Port**: 3000/websocket (Development), 80/443 (Production)
- **Implementation**: Native WebSocket với ws library
- **Đặc điểm**:
  - Persistent connection: Duy trì kết nối liên tục cho device registration
  - Low latency: Độ trễ thấp cho real-time hardware monitoring
  - Bidirectional: Giao tiếp hai chiều (device updates, shutdown commands)
  - Message validation: Zod schema validation cho tất cả messages

#### 2.1.3 Socket.IO Protocol
- **Mục đích**: Real-time communication giữa NuxtJS web client và server
- **Port**: 3000 (embedded trong HTTP server)
- **Implementation**: Socket.IO v4 với singleton pattern
- **Transport methods**:
  - WebSocket (primary)
  - HTTP long-polling (fallback)
- **Features**:
  - Auto-reconnection với exponential backoff
  - Component-based event management
  - Real-time device list updates
  - Admin/User role-based broadcasting
  - Event deduplication để tránh spam notifications

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

### 3.2 Socket.IO Events và Component Management

#### 3.2.1 Client to Server Events
- `get-devices`: Lấy danh sách thiết bị (với phân quyền admin/user)
- `shutdown-request`: Yêu cầu tắt thiết bị (với phân quyền admin/user)
- `disconnect`: Ngắt kết nối

#### 3.2.2 Server to Client Events
- `devices-response`: Response danh sách thiết bị với unique requestId
- `device-update`: Cập nhật thông tin thiết bị real-time
- `device-disconnect`: Thiết bị ngắt kết nối
- `device-shutdown`: Thiết bị được tắt
- `shutdown-response`: Response kết quả shutdown command
- `reconnect`: Tự động reconnect và refresh data

#### 3.2.3 Socket Management Pattern
```typescript
// Singleton Socket Manager
class SocketManager {
  private components: Map<string, ComponentCallbacks>
  private socket: Socket | null
  
  // Component registration với unique IDs
  registerComponent(id: string, callbacks: ComponentCallbacks)
  unregisterComponent(id: string)
  
  // Centralized event broadcasting
  private setupConsolidatedListeners()
  private broadcastToAllComponents(event: string, data: any)
}

// Component ID format: device-list-{path}-{role}
// Example: device-list-/devices-user, device-list-/admin/devices-admin
```

### 3.3 HTTP API Endpoints (NuxtJS Server Routes)

#### 3.3.1 Device Management
```
GET    /api/devices              - Lấy danh sách thiết bị (admin: tất cả, user: chỉ của mình)
POST   /api/devices/shutdown     - Gửi lệnh tắt thiết bị (với phân quyền)
PUT    /api/devices/:id          - Cập nhật thiết bị
DELETE /api/devices/:id          - Xóa thiết bị
```

#### 3.3.2 Admin Management
```
GET    /api/admin/users          - Lấy danh sách users (admin only)
GET    /api/admin/devices        - Deprecated - sử dụng /api/devices thay thế
```

#### 3.3.3 Authentication (Better Auth Integration)
```
POST   /api/auth/sign-in         - Đăng nhập (email/password, Google OAuth)
POST   /api/auth/sign-up         - Đăng ký
POST   /api/auth/sign-out        - Đăng xuất
POST   /api/auth/verify-email    - Xác thực email
GET    /api/auth/session         - Lấy session hiện tại
```

#### 3.3.4 Debug Tools (Development Only)
```
POST   /api/debug/trigger-event  - Trigger manual events cho testing
GET    /debug/socket            - Socket debug dashboard
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

### 4.3 Database Storage (PostgreSQL + Drizzle ORM)

#### 4.3.1 Device Schema (Drizzle ORM)
```typescript
// /db/deviceSchema.ts
export const devices = pgTable('devices', {
  macAddress: varchar('mac_address', { length: 17 }).primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  name: varchar('name', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  isConnected: boolean('is_connected').default(false).notNull(),
  hardware: jsonb('hardware').$type<HardwareInfo>(),
  lastSeen: timestamp('last_seen').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Admin queries with user information
db.select({
  ...devices,
  userName: user.name,
  userEmail: user.email
}).from(devices).leftJoin(user, eq(devices.userId, user.id));
```

#### 4.3.2 User Schema (Better Auth Integration)
```typescript
// Better Auth tự động tạo user table
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  role: text('role').default('user'), // 'user' | 'admin'
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull()
});
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

### 5.1 Authentication Flow (Better Auth)
```
1. User Registration/Login → Better Auth với Google OAuth hoặc Email/Password
2. Session-based Authentication (không dùng JWT)
3. Server-side Session Management với Database
4. Role-based Access Control (admin/user)
5. Device Registration với User ID từ session
6. MAC Address validation và uniqueness check
```

### 5.2 Authorization System
```typescript
// Admin role check
const userRole = session.user.role;
const isAdmin = userRole === 'admin' || 
  (Array.isArray(userRole) && userRole.includes('admin'));

// Device access control
if (isAdmin) {
  // Admin can see all devices with user information
  query = db.select({...devices, userName: user.name, userEmail: user.email})
    .from(devices).leftJoin(user, eq(devices.userId, user.id));
} else {
  // Regular users only see their own devices
  query = db.select().from(devices).where(eq(devices.userId, userId));
}
```

### 5.3 Security Measures
- **HTTPS**: Mã hóa dữ liệu truyền tải cho production
- **Session-based Auth**: Secure session management với Better Auth
- **Input Validation**: Comprehensive Zod schema validation cho tất cả inputs
- **CORS**: Cross-Origin Resource Sharing control
- **Role-based Access**: Admin/User permission system
- **SQL Injection Prevention**: Drizzle ORM prepared statements
- **XSS Protection**: Input sanitization và CSP headers

---

## 6. HIỆU NĂNG VÀ TỐI ƯU HÓA

### 6.1 Socket.IO Optimizations
- **Singleton Pattern**: Một Socket.IO instance duy nhất cho toàn bộ app
- **Component-based Management**: Component registration với unique IDs
- **Event Deduplication**: Tránh duplicate events và spam notifications
- **Automatic Reconnection**: Exponential backoff strategy
- **Fallback Strategy**: HTTP API fallback khi Socket.IO không khả dụng

### 6.2 WebSocket Optimizations  
- **Connection Pooling**: Efficient connection management cho device clients
- **Message Validation**: Zod schema validation để tránh invalid data
- **Heartbeat Mechanism**: Keep-alive để maintain persistent connections
- **Error Handling**: Comprehensive error handling và retry logic

### 6.3 Database Optimizations (PostgreSQL + Drizzle)
- **Indexing**: Indexes trên MAC address (primary key) và user ID (foreign key)
- **JSONB Fields**: Efficient storage và querying cho hardware information
- **Connection Pooling**: Drizzle ORM connection management
- **Query Optimization**: Optimized joins cho admin queries với user information
- **Prepared Statements**: SQL injection prevention và performance

### 6.4 Frontend Optimizations (NuxtJS 4)
- **SSR/SSG**: Server-Side Rendering với Nuxt.js 4
- **Code Splitting**: Automatic code splitting và lazy loading
- **Component Caching**: Vue component caching
- **Client-side Hydration**: Optimal hydration strategy
- **Asset Optimization**: Built-in Vite optimizations
- **Real-time Updates**: Efficient reactive updates với Vue 3 Composition API

### 6.5 Development Optimizations
- **HMR**: Hot Module Replacement với Vite
- **TypeScript**: Type safety và better DX
- **Debug Tools**: Browser console debug access và debug dashboard
- **Monitoring**: Real-time connection monitoring và logging

---

## 7. TESTING VÀ DEBUGGING

### 7.1 Debug Tools Implementation
```typescript
// Browser Console Debug Access
window.__deviceListDebug = {
  devices: devices.value,
  uniqueUsers: uniqueUsers.value,
  filteredDevices: filteredDevices.value,
  isAdmin: isAdmin.value,
  currentUser: currentUser.value,
  selectedUserFilter: selectedUserFilter.value,
  componentId: componentId.value
};

// Real-time monitoring
const monitor = setInterval(() => {
  console.log('📊 Live Data:', {
    deviceCount: window.__deviceListDebug.devices.length,
    onlineDevices: window.__deviceListDebug.devices.filter(d => d.isConnected).length,
    uniqueUsers: window.__deviceListDebug.uniqueUsers.length
  });
}, 5000);
```

### 7.2 Socket.IO Testing
```typescript
// Manual event triggering for testing
await $fetch('/api/debug/trigger-event', {
  method: 'POST',
  body: {
    type: 'device-update',
    macAddress: 'test-mac',
    deviceName: 'Test Device'
  }
});

// Component-based testing
const testComponent = 'device-list-/devices-admin';
setupDeviceListeners(testComponent, {
  onDeviceUpdate: (device) => console.log('Update:', device),
  onDeviceDisconnect: (mac) => console.log('Disconnect:', mac)
});
```

### 7.3 WebSocket Testing 
```javascript
// Device client WebSocket test
const ws = new WebSocket('ws://localhost:3000/websocket');

ws.onopen = () => {
  ws.send(JSON.stringify({
    messageType: "register",
    userId: "test-user-id",
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.100",
    machineName: "Test Machine",
    hardware: { /* complete hardware info */ }
  }));
};
```

### 7.4 Error Handling Strategy
- **Socket.IO Errors**: Automatic reconnection với exponential backoff
- **WebSocket Errors**: Connection retry mechanisms
- **Validation Errors**: Comprehensive Zod schema error reporting
- **Network Timeouts**: Graceful timeout handling với fallbacks
- **Database Errors**: Transaction rollback và proper error logging
- **Auth Errors**: Session validation và redirect handling

### 7.5 Debugging Features
- **Debug Dashboard**: `/debug/socket` page với real-time monitoring
- **Console Access**: `window.__deviceListDebug` cho runtime inspection
- **Debug Widget**: Floating debug widget cho admin users
- **Event Logging**: Comprehensive logging throughout the system
- **Connection Monitoring**: Real-time Socket.IO connection status

---

## 8. DEPLOYMENT VÀ PRODUCTION

### 8.1 Production Architecture (NuxtJS 4)
```
[Load Balancer/CDN] → [Nginx Reverse Proxy] → [NuxtJS 4 Server]
                                                      ↓
[Device WebSocket] ← [Socket.IO Server] ← [Better Auth Session]
                                                      ↓
                                              [PostgreSQL + Drizzle ORM]
```

### 8.2 Development vs Production
```typescript
// Development (localhost:3000)
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,
  nitro: {
    experimental: {
      wasm: true
    }
  }
});

// Production
export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: 'node-server', // or 'vercel', 'cloudflare', etc.
  },
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    databaseUrl: process.env.DATABASE_URL
  }
});
```

### 8.3 Scalability Considerations
- **Horizontal Scaling**: Multiple NuxtJS instances với shared PostgreSQL
- **Database Replication**: PostgreSQL master-slave configuration
- **Socket.IO Scaling**: Redis adapter cho multiple instances
- **CDN**: Static asset delivery via Vercel/Cloudflare
- **Session Storage**: Database-backed sessions cho consistency

---

## 9. KẾT LUẬN

### 9.1 Kết quả đạt được
- **✅ Full-stack Application**: Xây dựng thành công hệ thống quản lý thiết bị từ xa với NuxtJS 4
- **✅ Real-time Communication**: Triển khai dual-protocol system (WebSocket cho devices, Socket.IO cho web clients)
- **✅ Admin Dashboard**: Implement admin system với cross-user device visibility và user filtering
- **✅ Role-based Access Control**: Phân quyền admin/user với Better Auth integration
- **✅ Hardware Monitoring**: Thu thập và hiển thị thông tin phần cứng chi tiết real-time
- **✅ Socket Management**: Implement singleton pattern để tránh duplicate events
- **✅ Debug Tools**: Comprehensive debugging system với browser console access

### 9.2 Kiến thức thu được
- **Modern Web Development**: NuxtJS 4, Vue 3 Composition API, TypeScript
- **Network Protocols**: HTTP/HTTPS, WebSocket (RFC 6455), Socket.IO Protocol
- **Real-time Communication**: Dual-protocol architecture, event management, connection handling
- **Database Design**: PostgreSQL với Drizzle ORM, JSONB data storage, query optimization
- **Authentication**: Better Auth implementation, session management, role-based authorization
- **Security**: Input validation với Zod, SQL injection prevention, XSS protection
- **Performance Optimization**: Component-based Socket management, efficient database queries
- **Development Tools**: Debug dashboard, browser console integration, monitoring systems

### 9.3 Challenges & Solutions
- **Socket Event Conflicts**: Solved với singleton SocketManager pattern
- **HMR Issues**: Handled với proper component cleanup và connection management
- **Admin Permissions**: Implemented role-based queries với database joins
- **Real-time Updates**: Optimized với event deduplication và component-based broadcasting

### 9.4 Hướng phát triển
- **Production Deployment**: SSL/TLS certificates, environment configuration
- **Monitoring System**: Comprehensive logging và performance monitoring
- **Mobile Support**: React Native hoặc mobile-responsive design
- **Enhanced Security**: Rate limiting, advanced authentication methods
- **Scalability**: Redis adapter cho Socket.IO clustering
- **Advanced Features**: Device grouping, scheduled tasks, remote file management
- **Analytics**: Usage statistics, performance metrics dashboard

---

## 10. TÀI LIỆU THAM KHẢO

### 10.1 Network Protocols & Standards
1. **RFC 6455** - The WebSocket Protocol
2. **HTTP/1.1 Specification** - RFC 7230-7237
3. **TCP/IP Illustrated** - Richard Stevens
4. **Socket.IO Protocol** - https://socket.io/docs/v4/

### 10.2 Framework & Library Documentation
5. **NuxtJS 4 Documentation** - https://nuxt.com/
6. **Vue 3 Composition API** - https://vuejs.org/guide/
7. **Better Auth Documentation** - https://better-auth.com/
8. **Drizzle ORM Documentation** - https://orm.drizzle.team/
9. **@nuxt/ui Components** - https://ui.nuxt.com/
10. **Tailwind CSS** - https://tailwindcss.com/

### 10.3 Database & Development Tools
11. **PostgreSQL Documentation** - https://postgresql.org/docs/
12. **TypeScript Handbook** - https://typescriptlang.org/docs/
13. **Zod Schema Validation** - https://zod.dev/
14. **pnpm Package Manager** - https://pnpm.io/

### 10.4 Deployment & Production
15. **Vercel Deployment** - https://vercel.com/docs
16. **Docker Documentation** - https://docs.docker.com/
17. **Nginx Configuration** - https://nginx.org/en/docs/

---

## 11. PHỤ LỤC

### 11.1 Project Structure
```
net-address-web/
├── app/
│   ├── components/          # Vue components
│   │   ├── DeviceList.client.vue
│   │   ├── socket.ts        # Socket management
│   │   └── SocketDebugWidget.vue
│   ├── pages/               # NuxtJS pages
│   │   ├── devices.vue
│   │   ├── admin/
│   │   │   └── devices.vue
│   │   └── debug/
│   │       └── socket.vue
│   └── assets/
│       └── styles.css       # Global styles
├── server/
│   ├── api/                 # API routes
│   │   ├── devices.get.ts
│   │   ├── devices/
│   │   │   └── shutdown.post.ts
│   │   ├── admin/
│   │   │   └── users.get.ts
│   │   └── debug/
│   │       └── trigger-event.post.ts
│   └── utils/
│       ├── drizzle.ts       # Database connection
│       ├── websocket.ts     # WebSocket server
│       └── socket-io.ts     # Socket.IO server
├── db/
│   ├── deviceSchema.ts      # Device schema
│   └── authSchema.ts        # Auth schema
├── lib/
│   ├── auth.ts              # Better Auth config
│   └── auth-client.ts       # Client-side auth
├── nuxt.config.ts           # NuxtJS configuration
├── package.json             # Dependencies (pnpm)
└── drizzle.config.ts        # Database config
```

### 11.2 Database Schema
```sql
-- Users table (Better Auth)
CREATE TABLE user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN NOT NULL,
    image TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Devices table
CREATE TABLE devices (
    mac_address VARCHAR(17) PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    is_connected BOOLEAN DEFAULT FALSE,
    hardware JSONB,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_is_connected ON devices(is_connected);
```

---

**Ngày hoàn thành:** 26/05/2025  
**Project Repository:** [GitHub Link]  
**Live Demo:** [Production URL] 