import prosgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as authSchema from '../../db/authSchema';
import * as deviceSchema from '../../db/deviceSchema';

const db = prosgres(process.env.DATABASE_URL || '');

export const useDrizzle = () => {
    return drizzle(db, {
        schema: {
            ...authSchema,
            ...deviceSchema
        }
    });
}