"use client";

import { useState, useEffect, useRef } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import * as Ably from "ably";
import { Send, Sparkles, Loader2, User } from "lucide-react";

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

export default function StyleAssistantPage() {
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

  // Initialize Ably (using the frontend key if available, or we assume backend handles tokens. 
  // For simplicity, we just need a connection)
  useEffect(() => {
    // In production, use authUrl for secure Ably connection
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (key) {
      ablyRef.current = new Ably.Realtime({ key });
    }
    
    return () => {
      if (ablyRef.current) ablyRef.current.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStream]);

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
        setMessages((prev) => [...prev, { role: "ai", content: finalText }]);
        return "";
      });
    });

    channel.subscribe("error", () => {
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I encountered an error. Please try again." }]);
      setCurrentStream("");
      setIsTyping(false);
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || currentStream) return;

    const userMsg = input.trim();
    setInput("");
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

  return (
    <div className="container mx-auto px-4 py-12 lg:py-20 flex-1 flex flex-col h-[calc(100vh-64px-40px)]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold uppercase tracking-widest text-brand-gold flex items-center justify-center gap-2 mb-2">
          <Sparkles /> Style Assistant
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs">Powered by Gemini AI</p>
      </div>

      <div className="flex-1 bg-card border border-border flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-muted text-muted-foreground" : "bg-brand-gold text-black"}`}>
                {msg.role === "user" ? <User size={20} /> : <Sparkles size={20} />}
              </div>
              <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === "user" ? "bg-muted text-foreground" : "bg-transparent border border-border text-foreground"}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {currentStream && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold text-black flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="max-w-[80%] rounded-lg p-4 bg-transparent border border-border text-foreground">
                <p className="whitespace-pre-wrap leading-relaxed">{currentStream}</p>
                <span className="inline-block w-2 h-4 bg-brand-gold ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {isTyping && !currentStream && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold text-black flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="max-w-[80%] rounded-lg p-4 bg-transparent border border-border flex items-center gap-2">
                <Loader2 className="animate-spin text-brand-gold" size={16} />
                <span className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Analyzing...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-background border-t border-border">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for style advice, e.g., 'What pairs well with a black blazer?'"
              className="w-full bg-card border border-border py-4 pl-6 pr-16 focus:outline-none focus:border-brand-gold text-white placeholder:text-muted-foreground"
              disabled={isTyping || !!currentStream}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping || !!currentStream}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-gold hover:text-brand-gold-light disabled:opacity-50 transition-colors"
            >
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
