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

export interface MediaInfo {
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