'use client';

import { useState, useRef, useEffect } from 'react';
import { Chat, X, CircleNotch, Sparkle, Paperclip, Microphone, MicrophoneSlash, ArrowUp, File } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useChat } from './chat-context';
import { useSidebar } from '@/components/ui/sidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Show me loans in breach',
  'Which covenants are at warning?',
  'Summarize my portfolio health',
  'What documents need review?',
];

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export function ChatPanel() {
  const { isOpen, closeChat, openChat } = useChat();
  const { setOpen: setSidebarOpen } = useSidebar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarWasOpen, setSidebarWasOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function handleOpenChat() {
    // Store current sidebar state and collapse it
    setSidebarWasOpen(true);
    setSidebarOpen(false);
    openChat();
  }

  function handleCloseChat() {
    closeChat();
    // Restore sidebar
    setSidebarOpen(sidebarWasOpen);
  }

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

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion);
    inputRef.current?.focus();
  }

  function clearChat() {
    setMessages([]);
  }

  // File attachment handler
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  }

  function removeAttachedFile() {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Voice recording with Web Speech API
  function toggleVoiceRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function startRecording() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        setInput(prev => prev + finalTranscript);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setInterimTranscript('');

      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access to use voice input.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Floating button when panel is closed
  if (!isOpen) {
    return (
      <button
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        title="Open AI Assistant"
      >
        <Sparkle className="h-6 w-6" weight="fill" />
      </button>
    );
  }

  return (
    <div className="w-[380px] border-l bg-background flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-base">Sage</h3>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-xs h-7"
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCloseChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Chat className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-medium text-base mb-1">How can I help you?</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Ask about loans, covenants, or analytics.
            </p>
            <div className="w-full space-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-lg border bg-card hover:bg-muted transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
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
                    'max-w-[90%] rounded-2xl px-3 py-2',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CircleNotch className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
        />

        {/* Attached file preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg text-sm">
            <File className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{attachedFile.name}</span>
            <button
              type="button"
              onClick={removeAttachedFile}
              className="p-1 hover:bg-background rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 dark:text-red-400">
              {interimTranscript || 'Listening...'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={cn(
            "rounded-2xl border bg-background overflow-hidden transition-colors",
            isRecording ? "border-red-300 dark:border-red-700" : "border-input"
          )}>
            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Speak now..." : "Ask a question..."}
              rows={1}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm focus:outline-none min-h-[44px] max-h-[100px]"
            />
            {/* Bottom Bar with Icons */}
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    attachedFile
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title="Attach file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isRecording
                      ? "text-red-500 bg-red-100 dark:bg-red-900"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording ? (
                    <MicrophoneSlash className="h-5 w-5" />
                  ) : (
                    <Microphone className="h-5 w-5" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || (!input.trim() && !attachedFile)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  (input.trim() || attachedFile)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {loading ? (
                  <CircleNotch className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" weight="bold" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
