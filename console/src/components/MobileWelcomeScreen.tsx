import { Sparkles, MessageCircle, Zap, Rocket } from 'lucide-react';

interface MobileWelcomeScreenProps {
  onNewChat: () => void;
  onBrowseMorgys: () => void;
  onViewHistory: () => void;
  userName?: string;
}

export function MobileWelcomeScreen({
  onNewChat,
  onBrowseMorgys,
  onViewHistory,
  userName,
}: MobileWelcomeScreenProps) {
  const greeting = userName ? `Welcome back, ${userName}!` : 'Welcome to Morgus!';

  return (
    <div className="mobile-welcome-screen md:hidden flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center mb-8">
        <div className="mb-4">
          <Sparkles className="w-16 h-16 text-pink-400 mx-auto animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {greeting}
        </h1>
        <p className="text-slate-300 text-lg">
          Your AI Agent Forge
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <MessageCircle className="w-6 h-6" />
          Start New Chat
        </button>

        <button
          onClick={onBrowseMorgys}
          className="w-full bg-slate-800 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 border border-slate-700"
        >
          <Sparkles className="w-6 h-6 text-pink-400" />
          Browse Morgys
        </button>

        <button
          onClick={onViewHistory}
          className="w-full bg-slate-800 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 border border-slate-700"
        >
          <Zap className="w-6 h-6 text-cyan-400" />
          View Chat History
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-slate-400 text-sm mb-2">
          Powered by MOE + Nash Equilibrium
        </p>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Rocket className="w-4 h-4" />
          <span>v3.0.0</span>
        </div>
      </div>
    </div>
  );
}
