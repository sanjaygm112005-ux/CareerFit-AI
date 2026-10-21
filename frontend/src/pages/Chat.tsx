import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { chatWithAI } from '../services/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI Career Coach. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // You can fetch the most recent resume ID from history, or pass it via context.
  // For now, we will leave resumeId undefined which tells the AI it is a general chat,
  // or you could hook it up to a resume selection dropdown.

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Create message history for the API
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: userMessage.content });

      const res = await chatWithAI(history);
      
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-6rem)] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="text-brand-500" />
            AI Career Coach
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Ask about your career, interviews, or resume advice.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`max-w-[85%] sm:max-w-[75%] px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Bot size={18} />
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-brand-500" />
              <span className="text-slate-500 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
