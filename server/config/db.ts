import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { env } from './env.ts';

let memoryServer: MongoMemoryServer | null = null;
let databaseMode: 'atlas' | 'memory' = 'atlas';

export function getDatabaseMode(): 'atlas' | 'memory' {
  return databaseMode;
}

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  let uri = env.mongodbUri;

  if (!uri) {
    const dbDir = path.resolve(process.cwd(), '.mongodb-data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    try {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'trendora',
          dbPath: dbDir,
          storageEngine: 'wiredTiger',
        },
      });
    } catch {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'trendora',
        },
      });
    }

    uri = memoryServer.getUri();
    databaseMode = 'memory';
  } else {
    databaseMode = 'atlas';
  }

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  // Ensure schema index updates (such as non-unique multi-account indexes) sync cleanly on existing DBs
  try {
    const db = mongoose.connection.db;
    if (db) {
      const saIndexes = await db.collection('socialAccounts').indexes().catch(() => []);
      for (const idx of saIndexes) {
        if (idx.name === 'userId_1_platform_1' && idx.unique) {
          await db.collection('socialAccounts').dropIndex('userId_1_platform_1');
        }
      }
      const anIndexes = await db.collection('analytics').indexes().catch(() => []);
      for (const idx of anIndexes) {
        if (idx.name === 'userId_1_date_1_platform_1' && idx.unique) {
          await db.collection('analytics').dropIndex('userId_1_date_1_platform_1');
        }
      }
    }
  } catch (idxErr) {
    console.warn('[MongoDB] Index migration note:', idxErr);
  }

  console.log(`[MongoDB] Connected (${databaseMode === 'atlas' ? 'External / Atlas URI' : 'Local Development Instance'})`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
