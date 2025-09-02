import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// API routes
import { testSMTPRoute } from './api/test-smtp.js'
import { startSendRoute } from './api/start-send.js'
import { pauseSendRoute } from './api/pause-send.js'
import { resumeSendRoute } from './api/resume-send.js'
import { cancelSendRoute } from './api/cancel-send.js'
import { downloadLogsRoute } from './api/download-logs.js'
import { sessionRoute } from './api/session.js'

// WebSocket handler
import { setupWebSocket } from './lib/ws.js'

// Worker
import './worker/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'http://localhost:3000'
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || 'http://localhost:3000'
    : 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// File upload middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', testSMTPRoute)
app.use('/api', startSendRoute(upload))
app.use('/api', pauseSendRoute)
app.use('/api', resumeSendRoute)
app.use('/api', cancelSendRoute)
app.use('/api', downloadLogsRoute)
app.use('/api', sessionRoute)

// Setup WebSocket
setupWebSocket(io)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📧 Bulk Email Sender API ready`)
  console.log(`🔌 WebSocket enabled for real-time updates`)
})
