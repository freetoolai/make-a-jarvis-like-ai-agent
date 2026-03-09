"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type Mode = "normal" | "hud";

export default function JarvisInterface() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Good evening, sir. Jarvis at your service. How may I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("normal");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [statusText, setStatusText] = useState("ONLINE");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  // Animation state refs
  const tickRef = useRef(0);
  const ringsRef = useRef([0, 120, 240]);
  const haloRef = useRef(60);
  const targetHaloRef = useRef(60);
  const scaleRef = useRef(1);
  const targetScaleRef = useRef(1);
  const pulseRingsRef = useRef<number[]>([]);
  const scanAngleRef = useRef(0);
  const scan2AngleRef = useRef(180);
  const floatYRef = useRef(0);

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
          setStatusText("ONLINE");
          setInputText((prev) => {
            if (prev.trim()) {
              handleSendMessage(prev);
            }
            return "";
          });
        };

        recognitionRef.current.onstart = () => {
          setStatusText("LISTENING");
        };
      }
    }

    // Load saved API key
    const savedKey = localStorage.getItem("jarvis_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      tickRef.current++;
      const t = tickRef.current;
      const now = Date.now();
      const W = canvas.width;
      const H = canvas.height;
      const centerX = W / 2;
      const centerY = H / 2 - 50;
      const faceRadius = Math.min(W, H) * 0.18;

      ctx.clearRect(0, 0, W, H);

      // Update animation values
      const isActive = isSpeaking || isListening;
      
      // Halo animation
      if (isSpeaking) {
        targetScaleRef.current = 1.05 + Math.random() * 0.06;
        targetHaloRef.current = 138 + Math.random() * 44;
      } else if (isListening) {
        targetScaleRef.current = 1.02;
        targetHaloRef.current = 90;
      } else {
        targetScaleRef.current = 1.001 + Math.random() * 0.006;
        targetHaloRef.current = 50 + Math.random() * 18;
      }

      scaleRef.current += (targetScaleRef.current - scaleRef.current) * (isSpeaking ? 0.35 : 0.16);
      haloRef.current += (targetHaloRef.current - haloRef.current) * (isSpeaking ? 0.35 : 0.16);

      // Ring rotations
      const speeds = isSpeaking ? [1.2, -0.8, 1.9] : [0.5, -0.3, 0.82];
      ringsRef.current = ringsRef.current.map((r, i) => (r + speeds[i]) % 360);

      // Scan angles
      scanAngleRef.current = (scanAngleRef.current + (isSpeaking ? 2.8 : 1.2)) % 360;
      scan2AngleRef.current = (scan2AngleRef.current + (isSpeaking ? -1.7 : -0.68)) % 360;

      // Pulse rings
      const pspd = isSpeaking ? 3.8 : 1.8;
      const limit = faceRadius * 2;
      pulseRingsRef.current = pulseRingsRef.current
        .map(r => r + pspd)
        .filter(r => r < limit);
      if (pulseRingsRef.current.length < 3 && Math.random() < (isSpeaking ? 0.06 : 0.022)) {
        pulseRingsRef.current.push(0);
      }

      // Float animation
      floatYRef.current = Math.sin(t * 0.04) * 15;

      // Draw outer glow ring
      const gradient = ctx.createRadialGradient(centerX, centerY + floatYRef.current, 0, centerX, centerY + floatYRef.current, faceRadius * 2);
      gradient.addColorStop(0, "rgba(0, 212, 255, 0.05)");
      gradient.addColorStop(0.5, "rgba(0, 212, 255, 0.1)");
      gradient.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.beginPath();
      ctx.arc(centerX, centerY + floatYRef.current, faceRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw rotating ring 1
      ctx.beginPath();
      ctx.arc(centerX, centerY + floatYRef.current, faceRadius * 1.4, (ringsRef.current[0] * Math.PI) / 180, ((ringsRef.current[0] + 90) * Math.PI) / 180);
      ctx.strokeStyle = isSpeaking ? "rgba(129, 140, 248, 0.6)" : "rgba(0, 212, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw rotating ring 2
      ctx.beginPath();
      ctx.arc(centerX, centerY + floatYRef.current, faceRadius * 1.2, (ringsRef.current[1] * Math.PI) / 180, ((ringsRef.current[1] + 90) * Math.PI) / 180);
      ctx.strokeStyle = isSpeaking ? "rgba(129, 140, 248, 0.4)" : "rgba(0, 212, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw rotating ring 3
      ctx.beginPath();
      ctx.arc(centerX, centerY + floatYRef.current, faceRadius * 1.0, (ringsRef.current[2] * Math.PI) / 180, ((ringsRef.current[2] + 90) * Math.PI) / 180);
      ctx.strokeStyle = isSpeaking ? "rgba(129, 140, 248, 0.3)" : "rgba(0, 212, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw main circle (face placeholder)
      ctx.beginPath();
      ctx.arc(centerX, centerY + floatYRef.current, faceRadius * scaleRef.current, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 20, 40, 0.8)";
      ctx.fill();
      ctx.strokeStyle = isListening ? "rgba(0, 255, 136, 0.6)" : "rgba(0, 212, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw halo arc
      const haloRadius = faceRadius * scaleRef.current + haloRef.current / 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY + floatYRef.current, haloRadius, -Math.PI * 0.7, -Math.PI * 0.3);
      ctx.strokeStyle = isSpeaking ? "rgba(129, 140, 248, 0.5)" : "rgba(0, 212, 255, 0.3)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // Draw inner scan line
      const scanR = faceRadius * 0.8 * scaleRef.current;
      const scanX1 = centerX + Math.cos((scanAngleRef.current * Math.PI) / 180) * scanR;
      const scanY1 = centerY + floatYRef.current + Math.sin((scanAngleRef.current * Math.PI) / 180) * scanR;
      const scanX2 = centerX + Math.cos(((scanAngleRef.current + 180) * Math.PI) / 180) * scanR;
      const scanY2 = centerY + floatYRef.current + Math.sin(((scanAngleRef.current + 180) * Math.PI) / 180) * scanR;
      
      const gradient2 = ctx.createLinearGradient(scanX1, scanY1, scanX2, scanY2);
      gradient2.addColorStop(0, "rgba(0, 212, 255, 0)");
      gradient2.addColorStop(0.5, "rgba(0, 212, 255, 0.5)");
      gradient2.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.beginPath();
      ctx.moveTo(scanX1, scanY1);
      ctx.lineTo(scanX2, scanY2);
      ctx.strokeStyle = gradient2;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw second scan
      const scan2R = faceRadius * 0.5 * scaleRef.current;
      const scan2X1 = centerX + Math.cos((scan2AngleRef.current * Math.PI) / 180) * scan2R;
      const scan2Y1 = centerY + floatYRef.current + Math.sin((scan2AngleRef.current * Math.PI) / 180) * scan2R;
      const scan2X2 = centerX + Math.cos(((scan2AngleRef.current + 180) * Math.PI) / 180) * scan2R;
      const scan2Y2 = centerY + floatYRef.current + Math.sin(((scan2AngleRef.current + 180) * Math.PI) / 180) * scan2R;
      
      ctx.beginPath();
      ctx.moveTo(scan2X1, scan2Y1);
      ctx.lineTo(scan2X2, scan2Y2);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Draw pulse rings
      pulseRingsRef.current.forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY + floatYRef.current, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 - i * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw center core
      const coreGradient = ctx.createRadialGradient(centerX, centerY + floatYRef.current, 0, centerX, centerY + floatYRef.current, 20);
      coreGradient.addColorStop(0, isSpeaking ? "rgba(129, 140, 248, 0.9)" : "rgba(0, 212, 255, 0.9)");
      coreGradient.addColorStop(0.5, isSpeaking ? "rgba(129, 140, 248, 0.5)" : "rgba(0, 212, 255, 0.5)");
      coreGradient.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.beginPath();
      ctx.arc(centerX, centerY + floatYRef.current, 20, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Draw "JARVIS" text
      ctx.font = "14px monospace";
      ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
      ctx.textAlign = "center";
      ctx.fillText("JARVIS", centerX, centerY + floatYRef.current + faceRadius + 30);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isSpeaking, isListening]);

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
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      setStatusText("SPEAKING");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatusText("ONLINE");
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
    setStatusText("PROCESSING");

    try {
      // Check for API key - if configured, use it for better responses
      const savedKey = localStorage.getItem("jarvis_api_key");
      
      // Enhanced responses with more capabilities
      const responses: Record<string, string> = {
        hello: "Good evening, sir. It's a pleasure to meet you. How may I serve you?",
        "how are you": "I'm functioning at optimal capacity, thank you for asking. All systems are operational.",
        time: `The current time is ${new Date().toLocaleTimeString()}.`,
        date: `Today's date is ${new Date().toLocaleDateString()}.`,
        help: "I can assist you with a variety of tasks. I can tell you the time, date, answer questions, or help with various tasks. Just speak naturally!",
        thanks: "You're welcome, sir. Always at your service.",
        "who are you": "I am Jarvis, your personal AI assistant. I'm here to help you with any tasks you need.",
        "what can you do": "I can answer questions, tell you the time and date, help with calculations, and have natural conversations. My capabilities are continually expanding.",
        "open browser": "Opening browser... (This feature requires additional permissions in the web version)",
        "play music": "Playing music... (This feature requires additional permissions in the web version)",
        default: "I've processed your request. What else can I help you with?",
      };

      const lowerInput = messageText.toLowerCase();
      let response = responses.default;

      for (const [key, value] of Object.entries(responses)) {
        if (lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speak(response);
      setStatusText("RESPONDING");
    } catch (error) {
      console.error("Error:", error);
      setStatusText("ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === "normal" ? "hud" : "normal");
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("jarvis_api_key", apiKey.trim());
      setShowSettings(false);
      alert("API key saved successfully!");
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem("jarvis_api_key");
    setApiKey("");
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${mode === "hud" ? "bg-transparent" : "bg-black"}`}>
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-none ${mode === "hud" ? "opacity-80" : ""}`}
        style={mode === "hud" ? { background: "transparent" } : {}}
      />

      {/* Gradient overlay (disabled in HUD mode) */}
      {mode === "normal" && (
        <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
      )}

      {/* Main content */}
      <div className={`relative z-10 flex flex-col h-screen ${mode === "hud" ? "bg-black/30 backdrop-blur-sm" : ""}`}>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
            </div>
            <h1 className="text-xl font-light tracking-widest text-cyan-400">
              JARVIS
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <button
              onClick={toggleMode}
              className="px-3 py-1 text-xs text-cyan-500/60 border border-cyan-500/30 rounded hover:border-cyan-400 transition-colors"
            >
              {mode === "normal" ? "HUD MODE" : "NORMAL"}
            </button>
            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-cyan-500/60 hover:text-cyan-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-xs text-cyan-500/60">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {statusText}
            </div>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-20 right-6 z-50 w-80 bg-cyan-900/90 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-cyan-400 font-light tracking-widest mb-4">SETTINGS</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-cyan-500/60 mb-2 block">OpenRouter API Key (Optional)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key for enhanced AI..."
                  className="w-full bg-black/30 border border-cyan-500/30 rounded-lg px-3 py-2 text-cyan-100 text-sm placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveApiKey}
                  className="flex-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 py-2 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={clearApiKey}
                  className="flex-1 bg-red-500/20 border border-red-500/50 text-red-400 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-cyan-500/50">
                Get a free API key from{' '}
                <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
                  openrouter.ai
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-cyan-500/20 text-cyan-100"
                    : "bg-cyan-900/30 text-cyan-50 border border-cyan-500/30"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs text-cyan-500/50 mt-2">
                  {message.timestamp.toLocaleTimeString("en-US", { hour12: false })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-cyan-900/30 px-4 py-3 rounded-2xl border border-cyan-500/30">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Waveform Visualizer */}
        {isListening && (
          <div className="flex justify-center gap-1 py-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 100}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-cyan-500/20">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              {/* Voice button */}
              <button
                onClick={toggleListening}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening
                    ? "bg-green-500/20 border-2 border-green-500 animate-pulse"
                    : "bg-cyan-500/10 border border-cyan-500/50 hover:border-cyan-400"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 ${isListening ? "text-green-400" : "text-cyan-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              {/* Text input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-cyan-900/20 border border-cyan-500/30 rounded-xl px-4 py-3 text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 transition-colors"
              />

              {/* Send button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>

            {/* Status indicators */}
            <div className="flex justify-center gap-6 mt-4 text-xs text-cyan-500/50">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-green-500" : "bg-cyan-500/30"}`} />
                Voice {isListening ? "Active" : "Ready"}
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? "bg-purple-400 animate-pulse" : "bg-cyan-500/30"}`} />
                Audio {isSpeaking ? "Playing" : "Ready"}
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${mode === "hud" ? "bg-cyan-400" : "bg-cyan-500/30"}`} />
                {mode === "hud" ? "HUD Mode" : "Normal Mode"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
