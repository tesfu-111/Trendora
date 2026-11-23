import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

dotenv.config();

function getDevJwtSecret(): string {
  const secretDir = path.resolve(process.cwd(), '.mongodb-data');
  const secretPath = path.join(secretDir, '.jwt-secret');
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    if (!fs.existsSync(secretDir)) {
      fs.mkdirSync(secretDir, { recursive: true });
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, generated, { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const runtimeFallbackSecret = process.env.JWT_SECRET || getDevJwtSecret();

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:3000',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || runtimeFallbackSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  platforms: {
    facebook: {
      configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      clientId: process.env.META_APP_ID || '',
      requiredVars: ['META_APP_ID', 'META_APP_SECRET'],
      docsUrl: 'https://developers.facebook.com/docs/graph-api',
      oauthBase: 'https://www.facebook.com/v20.0/dialog/oauth',
      scopes: ['pages_show_list', 'pages_read_engagement', 'read_insights'],
    },
    instagram: {
      configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      clientId: process.env.META_APP_ID || '',
      requiredVars: ['META_APP_ID', 'META_APP_SECRET'],
      docsUrl: 'https://developers.facebook.com/docs/instagram-api',
      oauthBase: 'https://www.facebook.com/v20.0/dialog/oauth',
      scopes: ['instagram_basic', 'instagram_manage_insights', 'pages_show_list'],
    },
    tiktok: {
      configured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
      clientId: process.env.TIKTOK_CLIENT_KEY || '',
      requiredVars: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
      docsUrl: 'https://developers.tiktok.com/doc/display-api-overview',
      oauthBase: 'https://www.tiktok.com/v2/auth/authorize/',
      scopes: ['user.info.basic', 'user.info.stats', 'video.list'],
    },
    youtube: {
      configured: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      requiredVars: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
      docsUrl: 'https://developers.google.com/youtube/v3',
      oauthBase: 'https://accounts.google.com/o/oauth2/v2/auth',
      scopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
      ],
    },
    x: {
      configured: Boolean(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET),
      clientId: process.env.X_CLIENT_ID || '',
      requiredVars: ['X_CLIENT_ID', 'X_CLIENT_SECRET'],
      docsUrl: 'https://developer.x.com/en/docs/x-api',
      oauthBase: 'https://twitter.com/i/oauth2/authorize',
      scopes: ['tweet.read', 'users.read', 'offline.access'],
    },
  },
};
