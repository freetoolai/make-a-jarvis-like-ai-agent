"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Settings, X, Send, Sparkles, Play, Square } from "lucide-react";
import { SkiperButton } from "@/components/ui/skipper-button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function JarvisInterface() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm Jarvis. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  // Subtle pulse animation when listening
  useEffect(() => {
    if (isListening && pulseRef.current) {
      pulseRef.current.classList.add("animate-pulse");
    } else if (pulseRef.current) {
      pulseRef.current.classList.remove("animate-pulse");
    }
  }, [isListening]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          setInputText(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          setInputText((prev) => {
            if (prev.trim()) {
              handleSendMessage(prev);
            }
            return "";
          });
        };

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };
      }
    }

    // Load saved API key
    const savedKey = localStorage.getItem("jarvis_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputText("");
      recognitionRef.current.start();
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Simple response system
      const responses: Record<string, string> = {
        hello: "Hello! It's great to meet you. How can I assist you today?",
        "how are you": "I'm doing well, thank you for asking!",
        time: `The current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        date: `Today is ${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}.`,
        help: "I can help you with many things! Ask me the time, date, or just have a conversation. You can type or use voice input.",
        thanks: "You're welcome! Happy to help.",
        "who are you": "I'm Jarvis, your AI assistant. I'm here to help you with questions, tasks, or just to chat.",
        "what can you do": "I can answer questions, tell you the time and date, have conversations, and help with various tasks. Just ask!",
        default: "I understand. Is there anything specific I can help you with?",
      };

      const lowerInput = messageText.toLowerCase();
      let response = responses.default;

      for (const [key, value] of Object.entries(responses)) {
        if (lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      // Simulate thinking delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speak(response);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("jarvis_api_key", apiKey.trim());
      setShowSettings(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem("jarvis_api_key");
    setApiKey("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#1d1d1f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#2d2d2f]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Jarvis
            </h1>
          </div>
          <SkiperButton
              icon={Settings}
              isExpanded={showSettings}
              onToggle={() => setShowSettings(!showSettings)}
              variant="secondary"
              size="sm"
            />
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="sticky top-14 z-40">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="bg-white dark:bg-[#2d2d2f] rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
                <SkiperButton
                  icon={X}
                  onClick={() => setShowSettings(false)}
                  variant="secondary"
                  size="sm"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                    OpenRouter API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key for enhanced AI..."
                    className="w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <SkiperButton
                    icon={Play}
                    label="Save"
                    onClick={saveApiKey}
                    variant="primary"
                    size="sm"
                  />
                  <SkiperButton
                    icon={Square}
                    label="Clear"
                    onClick={clearApiKey}
                    variant="secondary"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat area */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4 mb-24">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-[#2d2d2f] text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/50 dark:border-gray-800"
                }`}
              >
                <p className="text-[15px] leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#2d2d2f] px-4 py-3 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#f5f5f7] dark:from-[#1d1d1f] via-[#f5f5f7]/95 dark:via-[#1d1d1f]/95 to-transparent pt-10 pb-6">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-[#2d2d2f] rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            {/* Listening indicator */}
            {isListening && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <span ref={pulseRef} className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">Listening...</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 p-2">
              <SkiperButton
                icon={isListening ? MicOff : Mic}
                isExpanded={isListening}
                onClick={toggleListening}
                variant={isListening ? "danger" : "secondary"}
                size="md"
              />
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-[15px] focus:outline-none"
              />
              
              <SkiperButton
                icon={Send}
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                variant={inputText.trim() && !isLoading ? "primary" : "secondary"}
                size="md"
              />
            </div>
          </div>
          
          <p className="text-center text-xs text-gray-400 mt-3">
            Jarvis can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
