import { Client, Message } from 'whatsapp-web.js';

export interface CommandContext {
  client: Client;
  message: Message;
  args: string[];
  command: string;
}

export interface CommandHandler {
  name: string;
  description: string;
  usage: string;
  execute: (context: CommandContext) => Promise<void>;
}

export interface StickerOptions {
  author?: string;
  pack?: string;
  quality?: number;
}

export interface MemeOptions extends StickerOptions {
  topText?: string;
  bottomText?: string;
  fontSize?: number;
  fontColor?: string;
}

export interface BotConfig {
  prefix: string;
  ownerNumber: string;
  botName: string;
  sessionPath: string;
}

export interface MediaFileInfo {
  mimetype: string;
  data: Buffer;
  filename?: string;
}

export enum MessageTypes {
  TEXT = 'chat',
  IMAGE = 'image',
  VIDEO = 'video',
  STICKER = 'sticker',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

export interface DownloadOptions {
  quality?: 'high' | 'medium' | 'low';
  format?: 'mp4' | 'mp3' | 'webm';
  maxSize?: number; // in MB
}

export interface DownloadResult {
  success: boolean;
  buffer?: Buffer;
  filename?: string;
  title?: string;
  duration?: string;
  size?: number;
  error?: string;
}

export interface MediaInfo {
  title: string;
  duration: string;
  thumbnail: string;
  url: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'facebook';
}