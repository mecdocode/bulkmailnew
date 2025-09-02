// Recipient data structure
export interface Recipient {
  email: string;
  name?: string;
  variables?: Record<string, string>;
}

// SMTP configuration
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email composition data
export interface EmailData {
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Pacing configuration
export interface PacingConfig {
  delayMs: number; // 500-10000ms
  concurrency: number; // 1-5
}

// Session data structure
export interface EmailSession {
  id: string;
  recipients: Recipient[];
  smtp: SMTPConfig;
  email: EmailData;
  pacing: PacingConfig;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  logs: LogEntry[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Log entry for each email attempt
export interface LogEntry {
  id: string;
  sessionId: string;
  recipient: string;
  status: 'queued' | 'sending' | 'sent' | 'failed' | 'retry';
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  timestamp: Date;
  retryCount: number;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Test SMTP response
export interface TestSMTPResponse {
  success: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    secure: boolean;
  };
}

// Session statistics
export interface SessionStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  rate: number; // emails per minute
  eta: number; // estimated time remaining in seconds
}
