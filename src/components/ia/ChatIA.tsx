import { useState, useRef, useEffect } from 'react'
import { Send, X, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { askIA, type ChatMessage } from '@/services/ia-chat'

export function ChatIA() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSend() {
    const question = input.trim()
    if (!question || loading) return

    const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { answer } = await askIA(question)
      const assistantMsg: ChatMessage = { role: 'assistant', content: answer, timestamp: new Date() }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setMessages([])
  }

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#01884d] to-[#016038] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center group"
          aria-label="Abrir assistente IA"
        >
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Painel do chat */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#01884d] to-[#016038] text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Assistente de Custos</p>
                <p className="text-[10px] text-white/70">Pergunte sobre dados do município</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="Limpar conversa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Fechar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 bg-[#01884d]/10 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-[#01884d]" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Como posso ajudar?</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Pergunte sobre custos, funcionários, atendimentos ou qualquer dado do sistema.
                </p>
                <div className="space-y-2 w-full">
                  {[
                    'Qual o custo total de pessoal por UBS?',
                    'Quantos enfermeiros temos no município?',
                    'Qual UBS tem o maior custo por atendimento?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[#01884d]/5 hover:border-[#01884d]/20 hover:text-[#01884d] transition-colors"
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-[#01884d]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#01884d]" />
                  </div>
                )}
                <div
                  className={[
                    'max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[#01884d] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md',
                  ].join(' ')}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-[#004aad]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-[#004aad]" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-[#01884d]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#01884d]" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#01884d] animate-spin" />
                    <span className="text-xs text-gray-500">Analisando dados...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Pergunte sobre custos, dados..."
                disabled={loading}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#01884d]/40 focus:border-[#01884d] focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-[#01884d] text-white rounded-xl flex items-center justify-center hover:bg-[#016038] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Enviar"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              IA pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
