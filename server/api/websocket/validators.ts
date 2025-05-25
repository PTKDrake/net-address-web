import { z } from 'zod';
import type { Peer } from "crossws";
import { devices, type HardwareInfo } from "~~/db/deviceSchema";
import { eq } from "drizzle-orm";
import { broadcastDeviceUpdate, broadcastDeviceDisconnect, broadcastDeviceShutdown } from '~~/server/plugins/socket.io';

// Hardware schema for validation
const HardwareSchema = z.object({
  cpu: z.object({
    model: z.string(),
    cores: z.number(),
    speed: z.number(),
    usage: z.number().optional()
  }).optional(),
  memory: z.object({
    total: z.number(),
    used: z.number(),
    available: z.number(),
    usage: z.number().optional()
  }).optional(),
  storage: z.object({
    total: z.number(),
    used: z.number(),
    available: z.number(),
    usage: z.number().optional()
  }).optional(),
  gpu: z.object({
    model: z.string(),
    memory: z.number().optional(),
    usage: z.number().optional()
  }).optional(),
  network: z.object({
    interfaces: z.array(z.object({
      name: z.string(),
      type: z.string(),
      speed: z.number().optional()
    }))
  }).optional(),
  os: z.object({
    name: z.string(),
    version: z.string(),
    architecture: z.string(),
    uptime: z.number().optional()
  }).optional(),
  motherboard: z.object({
    manufacturer: z.string(),
    model: z.string()
  }).optional()
}).optional();

// Base schemas for validation
const RegisterSchema = z.object({
  messageType: z.literal("register"),
  userId: z.string().optional(),
  macAddress: z.string().min(1, "MAC address is required"),
  ipAddress: z.string().min(1, "IP address is required"),
  machineName: z.string().min(1, "Machine name is required"),
  hardware: HardwareSchema
});

const ExistsSchema = z.object({
  messageType: z.literal("exists"),
  macAddress: z.string().min(1, "MAC address is required")
});

const UpdateSchema = z.object({
  messageType: z.literal("update"),
  macAddress: z.string().min(1, "MAC address is required"),
  ipAddress: z.string().min(1, "IP address is required"),
  machineName: z.string().min(1, "Machine name is required"),
  hardware: HardwareSchema
});

const DisconnectSchema = z.object({
  messageType: z.literal("disconnect"),
  macAddress: z.string().min(1, "MAC address is required")
});

const ShutdownSchema = z.object({
  messageType: z.literal("shutdown"),
  macAddress: z.string().min(1, "MAC address is required")
});

// Types
export type RegisterData = z.infer<typeof RegisterSchema>;
export type ExistsData = z.infer<typeof ExistsSchema>;
export type UpdateData = z.infer<typeof UpdateSchema>;
export type DisconnectData = z.infer<typeof DisconnectSchema>;
export type ShutdownData = z.infer<typeof ShutdownSchema>;

// Base abstract class for message processors
abstract class MessageProcessor<T> {
  protected data: T;
  protected peer: Peer;
  protected computerConnections: Map<string, Peer>;

  constructor(data: T, peer: Peer, computerConnections: Map<string, Peer>) {
    this.data = data;
    this.peer = peer;
    this.computerConnections = computerConnections;
  }

  abstract process(): Promise<void>;

  protected sendResponse(messageType: string, message: string) {
    this.peer.send(JSON.stringify({ messageType, message }));
  }

  protected sendError(message: string) {
    this.peer.send(JSON.stringify({ messageType: "error", message }));
  }
}

// Register message processor
export class RegisterProcessor extends MessageProcessor<RegisterData> {
  async process(): Promise<void> {
    const { userId, machineName, ipAddress, macAddress, hardware } = this.data;
    console.log(`Device registration/update request: ${machineName} (${macAddress})`);

    try {
      const existingDevices = await useDrizzle()
        .select({ macAddress: devices.macAddress, isConnected: devices.isConnected })
        .from(devices)
        .where(eq(devices.macAddress, macAddress))
        .limit(1);

      if (existingDevices.length > 0) {
        console.log(`Device already registered: ${machineName} (${macAddress}), updating info`);

        await useDrizzle().update(devices).set({
          name: machineName,
          ipAddress: ipAddress,
          lastSeen: new Date(),
          isConnected: true,
          hardware: hardware as HardwareInfo,
          updatedAt: new Date()
        }).where(eq(devices.macAddress, macAddress));

        this.sendResponse("info", existingDevices[0].isConnected ? "updated" : "connected");

        if (!this.computerConnections.has(macAddress)) {
          console.log(`Adding device to connections map: ${machineName} (${macAddress})`);
          this.computerConnections.set(macAddress, this.peer);
        }
      } else {
        // Only proceed with registration if userId is provided
        if (!userId) {
          console.warn(`Cannot register new device without userId: ${machineName} (${macAddress})`);
          this.sendError("userId required for new device registration");
          return;
        }

        console.log(`Registering new device: ${machineName} (${macAddress})`);

        await useDrizzle().insert(devices).values({
          userId: userId,
          ipAddress: ipAddress,
          macAddress: macAddress,
          name: machineName,
          isConnected: true,
          hardware: hardware as HardwareInfo
        });

        this.computerConnections.set(macAddress, this.peer);
        this.sendResponse("info", "registered");
      }

      // Broadcast device update to all clients
      console.log(`Broadcasting device update: ${machineName} (${macAddress})`);
      await broadcastDeviceUpdate(macAddress);
    } catch (error) {
      console.error('Error processing register message:', error);
      this.sendError("Failed to register/update device");
    }
  }
}

// Exists message processor (check if device exists)
export class ExistsProcessor extends MessageProcessor<ExistsData> {
  async process(): Promise<void> {
    const { macAddress } = this.data;
    console.log(`Device existence check: ${macAddress}`);

    try {
      const existingDevices = await useDrizzle()
        .select({ macAddress: devices.macAddress, name: devices.name, isConnected: devices.isConnected })
        .from(devices)
        .where(eq(devices.macAddress, macAddress))
        .limit(1);

      if (existingDevices.length > 0) {
        const device = existingDevices[0];
        this.sendResponse("exists", JSON.stringify({
          exists: true,
          name: device.name,
          isConnected: device.isConnected
        }));
      } else {
        this.sendResponse("exists", JSON.stringify({
          exists: false
        }));
      }
    } catch (error) {
      console.error('Error checking device existence:', error);
      this.sendError("Failed to check device existence");
    }
  }
}

// Update message processor
export class UpdateProcessor extends MessageProcessor<UpdateData> {
  async process(): Promise<void> {
    const { machineName, ipAddress, macAddress, hardware } = this.data;
    console.log(`Device update request: ${machineName} (${macAddress})`);

    try {
      await useDrizzle().update(devices).set({
        name: machineName,
        ipAddress: ipAddress,
        lastSeen: new Date(),
        isConnected: true,
        hardware: hardware as HardwareInfo,
        updatedAt: new Date()
      }).where(eq(devices.macAddress, macAddress));

      this.sendResponse("info", "updated");

      // Broadcast device update to all clients
      console.log(`Broadcasting device update: ${machineName} (${macAddress})`);
      await broadcastDeviceUpdate(macAddress);
    } catch (error) {
      console.error('Error processing update message:', error);
      this.sendError("Failed to update device");
    }
  }
}

// Disconnect message processor
export class DisconnectProcessor extends MessageProcessor<DisconnectData> {
  async process(): Promise<void> {
    const { macAddress } = this.data;
    console.log(`Device disconnect request: ${macAddress}`);

    try {
      await useDrizzle().update(devices).set({
        isConnected: false,
      }).where(eq(devices.macAddress, macAddress));

      this.computerConnections.delete(macAddress);
      this.sendResponse("info", "disconnected");

      // Broadcast device disconnection to all clients
      console.log(`Broadcasting device disconnect: ${macAddress}`);
      await broadcastDeviceDisconnect(macAddress);
    } catch (error) {
      console.error('Error processing disconnect message:', error);
      this.sendError("Failed to disconnect device");
    }
  }
}

// Shutdown message processor
export class ShutdownProcessor extends MessageProcessor<ShutdownData> {
  async process(): Promise<void> {
    const { macAddress } = this.data;
    console.log(`Device shutdown notification: ${macAddress}`);

    try {
      // Update device status in database
      await useDrizzle().update(devices).set({
        isConnected: false,
      }).where(eq(devices.macAddress, macAddress));

      // Remove from connections map
      this.computerConnections.delete(macAddress);

      // Broadcast device shutdown to all clients
      console.log(`Broadcasting device shutdown: ${macAddress}`);
      await broadcastDeviceShutdown(macAddress);
    } catch (error) {
      console.error('Error processing shutdown message:', error);
      this.sendError("Failed to process shutdown");
    }
  }
}

// Main validator class
export class WebSocketMessageValidator {
  private computerConnections: Map<string, Peer>;

  constructor(computerConnections: Map<string, Peer>) {
    this.computerConnections = computerConnections;
  }

  async validateAndProcess(rawMessage: any, peer: Peer): Promise<void> {
    try {
      // First, check if the message has a messageType
      if (!rawMessage || typeof rawMessage !== 'object' || !rawMessage.messageType) {
        peer.send(JSON.stringify({ messageType: "error", message: "Invalid message format: messageType is required" }));
        return;
      }

      const messageType = rawMessage.messageType;
      let processor: MessageProcessor<any>;

      switch (messageType) {
        case "register":
          const registerResult = RegisterSchema.safeParse(rawMessage);
          if (!registerResult.success) {
            peer.send(JSON.stringify({ 
              messageType: "error", 
              message: `Invalid register message: ${registerResult.error.issues.map(i => i.message).join(', ')}` 
            }));
            return;
          }
          processor = new RegisterProcessor(registerResult.data, peer, this.computerConnections);
          break;

        case "exists":
          const existsResult = ExistsSchema.safeParse(rawMessage);
          if (!existsResult.success) {
            peer.send(JSON.stringify({ 
              messageType: "error", 
              message: `Invalid exists message: ${existsResult.error.issues.map(i => i.message).join(', ')}` 
            }));
            return;
          }
          processor = new ExistsProcessor(existsResult.data, peer, this.computerConnections);
          break;

        case "update":
          const updateResult = UpdateSchema.safeParse(rawMessage);
          if (!updateResult.success) {
            peer.send(JSON.stringify({ 
              messageType: "error", 
              message: `Invalid update message: ${updateResult.error.issues.map(i => i.message).join(', ')}` 
            }));
            return;
          }
          processor = new UpdateProcessor(updateResult.data, peer, this.computerConnections);
          break;

        case "disconnect":
          const disconnectResult = DisconnectSchema.safeParse(rawMessage);
          if (!disconnectResult.success) {
            peer.send(JSON.stringify({ 
              messageType: "error", 
              message: `Invalid disconnect message: ${disconnectResult.error.issues.map(i => i.message).join(', ')}` 
            }));
            return;
          }
          processor = new DisconnectProcessor(disconnectResult.data, peer, this.computerConnections);
          break;

        case "shutdown":
          const shutdownResult = ShutdownSchema.safeParse(rawMessage);
          if (!shutdownResult.success) {
            peer.send(JSON.stringify({ 
              messageType: "error", 
              message: `Invalid shutdown message: ${shutdownResult.error.issues.map(i => i.message).join(', ')}` 
            }));
            return;
          }
          processor = new ShutdownProcessor(shutdownResult.data, peer, this.computerConnections);
          break;

        default:
          peer.send(JSON.stringify({ 
            messageType: "error", 
            message: `Unknown message type: ${messageType}` 
          }));
          return;
      }

      await processor.process();
    } catch (error) {
      console.error('Error in message validation and processing:', error);
      peer.send(JSON.stringify({ messageType: "error", message: "Server error processing message" }));
    }
  }
} 