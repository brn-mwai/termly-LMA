'use client';

import { useState, useRef, useEffect } from 'react';
import { Chat, X, PaperPlaneTilt, CircleNotch, Minus, ArrowsOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Chat failed');

      const { data } = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={cn(
          'fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg transition-all hover:scale-105',
          isOpen ? 'bg-gray-700 text-white' : 'bg-primary text-primary-foreground'
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Chat className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-24 right-6 z-50 flex flex-col rounded-lg bg-background border shadow-2xl transition-all',
            isMinimized ? 'h-14 w-80' : 'h-[500px] w-[400px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 rounded-t-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold">Termly Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <ArrowsOut className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Chat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Ask me about your loans, covenants, or portfolio!
                    </p>
                    <div className="mt-4 space-y-2">
                      {[
                        'Show me loans in breach',
                        'Which covenants are at warning?',
                        'Explain leverage ratio',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-4 py-2',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted px-4 py-2">
                      <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your portfolio..."
                    className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                    <PaperPlaneTilt className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
