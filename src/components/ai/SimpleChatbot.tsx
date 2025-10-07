'use client'

import { useMemo, useEffect, useRef, useState, FormEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, Loader2, CircleStop } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type SimpleChatbotProps = {
  title?: string
  className?: string
}

export function SimpleChatbot({
  title = 'VineSight Simple Chatbot',
  className
}: SimpleChatbotProps) {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/simple-chat' }), [])
  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    id: 'vinesight-simple-chatbot',
    transport
  })
  const [input, setInput] = useState('')
  const messageListRef = useRef<HTMLDivElement>(null)

  const isStreaming = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [messages, isStreaming])

  useEffect(() => {
    if (!error) {
      return
    }

    const timeout = window.setTimeout(() => clearError(), 5000)
    return () => window.clearTimeout(timeout)
  }, [error, clearError])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || isStreaming) return

    await sendMessage({ text: content })
    setInput('')
  }

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask quick vineyard questions and get concise, practical tips.
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div ref={messageListRef} className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground">
              Try asking “How should I schedule irrigation for my vines this week?”
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {message.parts.some((part) => part.type === 'text') ? (
                    message.parts.map((part, index) =>
                      part.type === 'text' ? (
                        <p key={index} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </p>
                      ) : null
                    )
                  ) : (
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                      Accessing memory…
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          {isStreaming ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating response…
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a grape farming question..."
            rows={3}
            disabled={isStreaming}
          />
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => stop()} disabled={!isStreaming}>
              <CircleStop className="mr-2 h-4 w-4" />
              Stop
            </Button>
            <Button type="submit" disabled={input.trim().length === 0 || isStreaming}>
              {isStreaming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}
