import { Server, Socket } from 'socket.io'
import { WebSocketEvent } from '@bulk-email/shared'

interface SocketData {
  sessionId?: string
}

let io: Server

export function setupWebSocket(socketServer: Server) {
  io = socketServer

  io.on('connection', (socket: Socket<any, any, any, SocketData>) => {
    console.log(`Client connected: ${socket.id}`)

    // Join session room
    socket.on('join_session', (sessionId: string) => {
      socket.data.sessionId = sessionId
      socket.join(`session:${sessionId}`)
      console.log(`Client ${socket.id} joined session: ${sessionId}`)
    })

    // Leave session room
    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`)
      console.log(`Client ${socket.id} left session: ${sessionId}`)
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}

// Broadcast event to all clients in a session
export function broadcastToSession(sessionId: string, event: WebSocketEvent) {
  if (!io) {
    console.warn('WebSocket not initialized')
    return
  }

  io.to(`session:${sessionId}`).emit('email_event', event)
}

// Broadcast to all connected clients
export function broadcastToAll(event: WebSocketEvent) {
  if (!io) {
    console.warn('WebSocket not initialized')
    return
  }

  io.emit('email_event', event)
}

// Get connected clients count for a session
export function getSessionClientCount(sessionId: string): number {
  if (!io) return 0
  
  const room = io.sockets.adapter.rooms.get(`session:${sessionId}`)
  return room ? room.size : 0
}
