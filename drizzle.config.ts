import {defineConfig} from "drizzle-kit";


export default defineConfig({
    dialect: 'postgresql',
    schema: ['./db/authSchema.ts', './db/deviceSchema.ts'],
    out: './db/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL || '',
    }
})