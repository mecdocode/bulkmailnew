// WebSocket event types for real-time communication

export type WebSocketEventType = 
  | 'session_created'
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_cancelled'
  | 'session_completed'
  | 'email_queued'
  | 'email_sending'
  | 'email_sent'
  | 'email_failed'
  | 'email_retry'
  | 'stats_updated'
  | 'error';

// Base event structure
export interface BaseWebSocketEvent {
  type: WebSocketEventType;
  sessionId: string;
  timestamp: Date;
}

// Session events
export interface SessionCreatedEvent extends BaseWebSocketEvent {
  type: 'session_created';
  data: {
    sessionId: string;
    totalRecipients: number;
  };
}

export interface SessionStartedEvent extends BaseWebSocketEvent {
  type: 'session_started';
}

export interface SessionPausedEvent extends BaseWebSocketEvent {
  type: 'session_paused';
}

export interface SessionResumedEvent extends BaseWebSocketEvent {
  type: 'session_resumed';
}

export interface SessionCancelledEvent extends BaseWebSocketEvent {
  type: 'session_cancelled';
}

export interface SessionCompletedEvent extends BaseWebSocketEvent {
  type: 'session_completed';
  data: {
    totalSent: number;
    totalFailed: number;
    duration: number; // in seconds
  };
}

// Email events
export interface EmailQueuedEvent extends BaseWebSocketEvent {
  type: 'email_queued';
  data: {
    recipient: string;
    position: number;
  };
}

export interface EmailSendingEvent extends BaseWebSocketEvent {
  type: 'email_sending';
  data: {
    recipient: string;
  };
}

export interface EmailSentEvent extends BaseWebSocketEvent {
  type: 'email_sent';
  data: {
    recipient: string;
    messageId: string;
  };
}

export interface EmailFailedEvent extends BaseWebSocketEvent {
  type: 'email_failed';
  data: {
    recipient: string;
    errorCode?: string;
    errorMessage: string;
    retryCount: number;
    willRetry: boolean;
  };
}

export interface EmailRetryEvent extends BaseWebSocketEvent {
  type: 'email_retry';
  data: {
    recipient: string;
    retryCount: number;
    nextAttemptIn: number; // seconds
  };
}

// Stats events
export interface StatsUpdatedEvent extends BaseWebSocketEvent {
  type: 'stats_updated';
  data: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    rate: number; // emails per minute
    eta: number; // seconds remaining
  };
}

// Error events
export interface ErrorEvent extends BaseWebSocketEvent {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}

// Union type for all events
export type WebSocketEvent = 
  | SessionCreatedEvent
  | SessionStartedEvent
  | SessionPausedEvent
  | SessionResumedEvent
  | SessionCancelledEvent
  | SessionCompletedEvent
  | EmailQueuedEvent
  | EmailSendingEvent
  | EmailSentEvent
  | EmailFailedEvent
  | EmailRetryEvent
  | StatsUpdatedEvent
  | ErrorEvent;
