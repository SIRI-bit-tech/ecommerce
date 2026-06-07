"use client";

import { useState, useEffect, useRef } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import * as Ably from "ably";
import { Send, Sparkles, Loader2, User, X, MessageSquarePlus } from "lucide-react";

const START_CHAT = gql`
  mutation StartStyleChat($message: String!) {
    startStyleChat(message: $message)
  }
`;

const CONTINUE_CHAT = gql`
  mutation ContinueStyleChat($sessionId: String!, $message: String!) {
    continueStyleChat(sessionId: $sessionId, message: $message)
  }
`;

type Message = {
  role: "user" | "ai";
  content: string;
};

interface StartChatData {
  startStyleChat: string;
}

interface ContinueChatData {
  continueStyleChat: string;
}

const SUGGESTED_PROMPTS = [
  "Recommend a summer dress",
  "What pairs well with a black blazer?",
  "Show me some formal wear",
];

export function StyleAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am your personal style assistant at Rey's Vogue. How can I help you elevate your wardrobe today?" }
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStream, setCurrentStream] = useState("");
  
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [startChat] = useMutation<StartChatData>(START_CHAT);
  const [continueChat] = useMutation<ContinueChatData>(CONTINUE_CHAT);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (key) {
      ablyRef.current = new Ably.Realtime({ key });
    }
    
    return () => {
      if (ablyRef.current) ablyRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentStream, isOpen]);

  const subscribeToSession = (id: string) => {
    if (!ablyRef.current) return;
    
    const channel = ablyRef.current.channels.get(`chat-${id}`);
    channelRef.current = channel;
    
    channel.subscribe("token", (message) => {
      setIsTyping(false);
      setCurrentStream((prev) => prev + message.data.text);
    });

    channel.subscribe("done", () => {
      setCurrentStream((finalText) => {
        if (!finalText.trim()) return "";
        setMessages((prev) => {
          // Prevent duplicate messages if Ably double-fires the event
          if (prev.length > 0 && prev[prev.length - 1].content === finalText) {
            return prev;
          }
          return [...prev, { role: "ai", content: finalText }];
        });
        return "";
      });
    });

    channel.subscribe("error", (message) => {
      const errorText = message.data?.message || "Sorry, I encountered an error. Please try again.";
      setMessages((prev) => [...prev, { role: "ai", content: errorText }]);
      setCurrentStream("");
      setIsTyping(false);
    });
  };

  const renderMessageContent = (text: string) => {
    // 1. Split by links [Text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
  
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <a key={match.index} href={match[2]} className="text-brand-gold underline font-bold hover:text-brand-gold-light" target="_blank" rel="noopener noreferrer">
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
  
    // 2. Handle bold text **text** within the string parts
    return parts.map((part, i) => {
      if (typeof part === 'string') {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const bParts = [];
        let bLastIndex = 0;
        let bMatch;
        while ((bMatch = boldRegex.exec(part)) !== null) {
          if (bMatch.index > bLastIndex) {
            bParts.push(part.slice(bLastIndex, bMatch.index));
          }
          bParts.push(<strong key={bMatch.index} className="font-bold">{bMatch[1]}</strong>);
          bLastIndex = boldRegex.lastIndex;
        }
        if (bLastIndex < part.length) {
          bParts.push(part.slice(bLastIndex));
        }
        return <span key={i}>{bParts.length > 0 ? bParts : part}</span>;
      }
      return part;
    });
  };

  const handleSend = async (msgOverride?: string) => {
    const userMsg = msgOverride || input.trim();
    if (!userMsg || isTyping || currentStream) return;

    if (!msgOverride) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      if (!sessionId) {
        const { data } = await startChat({ variables: { message: userMsg } });
        const newSessionId = data?.startStyleChat;
        if (!newSessionId) throw new Error("Failed to start chat session");
        setSessionId(newSessionId);
        subscribeToSession(newSessionId);
      } else {
        await continueChat({ variables: { sessionId, message: userMsg } });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-brand-gold text-black">
            <div className="flex items-center gap-2 font-serif font-bold uppercase tracking-widest">
              <Sparkles size={20} />
              <span>Style Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              aria-label="Close assistant"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-muted text-muted-foreground" : "bg-brand-gold text-black"}`}>
                  {msg.role === "user" ? <User size={16} /> : <Sparkles size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-muted text-foreground" : "bg-card border border-border text-foreground"}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{renderMessageContent(msg.content)}</p>
                </div>
              </div>
            ))}

            {currentStream && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-gold text-black flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="max-w-[80%] rounded-lg p-3 text-sm bg-card border border-border text-foreground">
                  <p className="whitespace-pre-wrap leading-relaxed">{renderMessageContent(currentStream)}</p>
                  <span className="inline-block w-1.5 h-3 bg-brand-gold ml-1 animate-pulse" />
                </div>
              </div>
            )}

            {isTyping && !currentStream && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-gold text-black flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="max-w-[80%] rounded-lg p-3 text-sm bg-card border border-border flex items-center gap-2">
                  <Loader2 className="animate-spin text-brand-gold" size={14} />
                  <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Analyzing...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-card border-t border-border flex flex-col gap-3">
            {/* Suggested Prompts */}
            {messages.length === 1 && !isTyping && !currentStream && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground border border-border px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquarePlus size={12} />
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for style advice..."
                className="w-full bg-background border border-border py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-brand-gold text-white placeholder:text-muted-foreground rounded-none"
                disabled={isTyping || !!currentStream}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || !!currentStream}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-gold hover:text-brand-gold-light disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-muted text-foreground' : 'bg-brand-gold text-black'
        }`}
        aria-label="Toggle style assistant"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </button>
    </div>
  );
}
