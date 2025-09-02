import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { AttachmentProvider } from './contexts/AttachmentContext'
import Landing from './routes/Landing'
import Recipients from './routes/Recipients'
import SMTP from './routes/SMTP'
import Compose from './routes/Compose'
import Pacing from './routes/Pacing'
import Monitor from './routes/Monitor'

function App() {
  return (
    <AttachmentProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/recipients" element={<Recipients />} />
            <Route path="/smtp" element={<SMTP />} />
            <Route path="/compose" element={<Compose />} />
            <Route path="/pacing" element={<Pacing />} />
            <Route path="/monitor/:sessionId" element={<Monitor />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AttachmentProvider>
  )
}

export default App
