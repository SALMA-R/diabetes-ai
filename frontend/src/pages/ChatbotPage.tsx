import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bot, Send, User } from 'lucide-react'
import axios from 'axios'
import type { PatientData } from '../services/api'

interface Message {
  id: number
  role: 'user' | 'bot'
  text: string
}

const SUGGESTIONS = [
  "Qu'est-ce que le diabète de type 2 ?",
  "Comment réduire mon risque ?",
  "Quels sont les symptômes ?",
  "Expliquez mon résultat",
]

const WELCOME: Message = {
  id: 0,
  role: 'bot',
  text: "Bonjour ! Je suis votre assistant médical. Je peux répondre à vos questions sur le diabète, expliquer votre résultat ou vous donner des conseils personnalisés.",
}

function loadContext(): Record<string, unknown> {
  try {
    const rawPatient = localStorage.getItem('lastPatientData')
    const rawScore   = localStorage.getItem('lastRiskScore')
    const ctx: Record<string, unknown> = {}
    if (rawPatient) Object.assign(ctx, JSON.parse(rawPatient) as PatientData)
    if (rawScore)   ctx.risk_score = parseFloat(rawScore)
    return ctx
  } catch { return {} }
}

// Render markdown-lite: **bold**, bullet •, newlines
function renderText(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const nodes = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
    )
    return <p key={i} className={line.startsWith('•') ? 'pl-2' : ''}>{nodes}</p>
  })
}

export default function ChatbotPage() {
  const navigate   = useNavigate()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const nextId     = useRef(1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setInput('')

    const userMsg: Message = { id: nextId.current++, role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    try {
      const { data } = await axios.post<{ response: string }>(
        'http://localhost:8000/chat',
        { message: trimmed, patient_context: loadContext() }
      )
      setMessages(prev => [...prev, { id: nextId.current++, role: 'bot', text: data.response }])
    } catch {
      setMessages(prev => [...prev, {
        id: nextId.current++,
        role: 'bot',
        text: "Désolé, je ne peux pas répondre pour l'instant. Vérifiez que le serveur est démarré.",
      }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">Assistant Médical IA</h1>
            <p className="text-xs text-gray-500">Posez vos questions sur le diabète</p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            En ligne
          </span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map(msg => (
            <div key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

              {msg.role === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}

              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'}`}>
                {msg.role === 'bot' ? renderText(msg.text) : <p>{msg.text}</p>}
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Quick suggestions ── */}
      <div className="bg-white border-t border-gray-100 px-4 pt-3">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {SUGGESTIONS.map(s => (
            <button key={s}
              onClick={() => sendMessage(s)}
              disabled={typing}
              className="flex-shrink-0 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700
                text-xs font-medium rounded-full border border-blue-200 transition-colors
                disabled:opacity-40">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Posez votre question..."
            disabled={typing}
            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm
              outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
              disabled:bg-gray-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40
              rounded-full flex items-center justify-center transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

    </div>
  )
}
