import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Monitor, Users } from 'lucide-react';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
  peerAvatar: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ isOpen, onClose, peerName, peerAvatar }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
        setDuration(0);
        return;
    }
    const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatDuration = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Call Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg">
                <Users size={20} className="text-white" />
            </div>
            <div>
                <h2 className="text-white font-semibold text-lg shadow-sm">Nexus Video Secure</h2>
                <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Encrypted • {formatDuration(duration)}
                </p>
            </div>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 relative bg-slate-800 overflow-hidden flex items-center justify-center">
        {/* Remote Stream (The person you are talking to) */}
        <div className="w-full h-full relative">
            <img 
                src={peerAvatar} 
                alt={peerName} 
                className="w-full h-full object-cover opacity-40 blur-xl absolute inset-0"
            />
             <img 
                src={peerAvatar} 
                alt={peerName} 
                className="w-full h-full object-contain relative z-0"
            />
            <div className="absolute bottom-8 left-8 text-white z-10">
                <h3 className="text-2xl font-bold">{peerName}</h3>
                <p className="text-indigo-300">Speaking...</p>
            </div>
        </div>

        {/* Local Stream (PiP) */}
        <div className="absolute top-6 right-6 w-48 h-36 bg-black rounded-xl border-2 border-slate-700 shadow-2xl overflow-hidden z-20">
             <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                <span className="text-xs text-slate-400">Your Camera</span>
             </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 bg-slate-900 flex items-center justify-center space-x-6 pb-4">
        <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
        >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-white text-slate-900' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
        >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <button 
            onClick={onClose}
            className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-red-500/30 transition-all transform hover:scale-105"
        >
            <PhoneOff size={32} />
        </button>

         <button className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700">
            <Monitor size={24} />
        </button>

        <button className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700">
            <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
};