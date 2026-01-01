import { MessageCircle, Sparkles, MessagesSquare, BookOpen, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
  onChatClick?: () => void;
  onMorgysClick?: () => void;
  onChatsClick?: () => void;
  onNotesClick?: () => void;
  onProfileClick?: () => void;
}

export function MobileBottomNav({
  onChatClick,
  onMorgysClick,
  onChatsClick,
  onNotesClick,
  onProfileClick,
}: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleChatClick = () => {
    if (onChatClick) {
      onChatClick();
    } else {
      navigate('/');
    }
  };

  const handleMorgysClick = () => {
    if (onMorgysClick) {
      onMorgysClick();
    } else {
      navigate('/morgys');
    }
  };

  const handleChatsClick = () => {
    if (onChatsClick) {
      onChatsClick();
    } else {
      navigate('/chats');
    }
  };

  const handleNotesClick = () => {
    if (onNotesClick) {
      onNotesClick();
    } else {
      navigate('/notes');
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={handleChatClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/') ? 'text-pink-400' : 'text-slate-400'
          }`}
        >
          <MessageCircle className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">CHAT</span>
        </button>

        <button
          onClick={handleMorgysClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/morgys') ? 'text-pink-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">MORGYS</span>
        </button>

        <button
          onClick={handleChatsClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/chats') ? 'text-pink-400' : 'text-slate-400'
          }`}
        >
          <MessagesSquare className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">CHATS</span>
        </button>

        <button
          onClick={handleNotesClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/notes') ? 'text-pink-400' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">NOTES</span>
        </button>

        <button
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/profile') ? 'text-pink-400' : 'text-slate-400'
          }`}
        >
          <User className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">PROFILE</span>
        </button>
      </div>
    </div>
  );
}
