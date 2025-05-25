import {pgTable, varchar, timestamp, text, uuid, boolean, json} from 'drizzle-orm/pg-core';
import {relations} from 'drizzle-orm';
import {user} from './authSchema';
import type {InferSelectModel} from "drizzle-orm";

// Hardware interface for type safety
export interface HardwareInfo {
    cpu?: {
        model: string;
        cores: number;
        speed: number; // GHz
        usage?: number; // percentage
    };
    memory?: {
        total: number; // GB
        used: number; // GB
        available: number; // GB
        usage?: number; // percentage
    };
    storage?: {
        total: number; // GB
        used: number; // GB
        available: number; // GB
        usage?: number; // percentage
    };
    gpu?: {
        model: string;
        memory?: number; // GB
        usage?: number; // percentage
    };
    network?: {
        interfaces: Array<{
            name: string;
            type: string; // ethernet, wifi, etc.
            speed?: number; // Mbps
        }>;
    };
    os?: {
        name: string;
        version: string;
        architecture: string;
        uptime?: number; // seconds
    };
    motherboard?: {
        manufacturer: string;
        model: string;
    };
}

export const devices = pgTable('devices', {
    macAddress: varchar('mac_address', {length: 17}).unique().notNull(), // Format: XX:XX:XX:XX:XX:XX
    userId: text('user_id').references(() => user.id).notNull(),
    name: varchar('name', {length: 100}).notNull(),
    ipAddress: varchar('ip_address', {length: 45}).notNull(), // IPv6 can be up to 45 characters
    isConnected: boolean('is_connected').default(false).notNull(),
    hardware: json('hardware').$type<HardwareInfo>(), // JSON field for hardware information
    lastSeen: timestamp('last_seen').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Define relationship with user table
export const devicesRelations = relations(devices, ({one}) => ({
    user: one(user, {
        fields: [devices.userId],
        references: [user.id],
    }),
}));

// Type for Device
export type Device = InferSelectModel<typeof devices>;
