import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import JarvisInterface from "@/components/JarvisInterface";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Voice-powered orb background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <VoicePoweredOrb 
          enableVoiceControl={true}
          hue={220}
          className="w-full h-full"
        />
      </div>
      {/* Jarvis interface on top */}
      <div className="relative z-10">
        <JarvisInterface />
      </div>
    </div>
  );
}
