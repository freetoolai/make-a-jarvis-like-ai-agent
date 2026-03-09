"use client";

import React, { useState } from "react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

export default function VoicePoweredOrbPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDetected, setVoiceDetected] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-8">
        {/* Orb */}
        <div className="w-96 h-96 relative">
          <VoicePoweredOrb
            enableVoiceControl={isRecording}
            className="rounded-xl overflow-hidden shadow-2xl"
            onVoiceDetected={setVoiceDetected}
          />
          
          {/* Voice detected indicator */}
          {voiceDetected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Voice detected</span>
            </div>
          )}
        </div>

        {/* Control Button */}
        <Button
          onClick={toggleRecording}
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="px-8 py-3"
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5 mr-3" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-3" />
              Start Recording
            </>
          )}
        </Button>

        {/* Simple Instructions */}
        <p className="text-slate-400 text-center max-w-md">
          Click the button to enable voice control. Speak to see the orb respond to your voice with subtle movements.
        </p>
      </div>
    </div>
  );
}
