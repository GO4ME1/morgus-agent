# Working Mobile Code from Deployment 803d2300
## Date: December 24, 2025 at 6:31 PM PST

This file contains the extracted mobile code from the working deployment.
Deployment URL: https://803d2300.morgus-console.pages.dev

## Mobile Bottom Navigation JSX (extracted from minified JS)

```jsx
{isMobile && (
  <nav className="mobile-bottom-nav">
    <button
      className={`mobile-nav-item ${mobileActiveTab === 'chat' ? 'active' : ''}`}
      onClick={() => {
        setMobileActiveTab('chat');
        setShowMorgyPen(false);
        setShowHistory(false);
        setShowProfile(false);
      }}
    >
      <span className="mobile-nav-icon">💬</span>
      <span className="mobile-nav-label">Chat</span>
    </button>
    <button
      className={`mobile-nav-item ${mobileActiveTab === 'morgys' ? 'active' : ''}`}
      onClick={() => {
        setMobileActiveTab('morgys');
        setShowMorgyPen(true);
      }}
    >
      <span className="mobile-nav-icon">🐷</span>
      <span className="mobile-nav-label">Morgys</span>
    </button>
    <button
      className={`mobile-nav-item ${mobileActiveTab === 'history' ? 'active' : ''}`}
      onClick={() => {
        setMobileActiveTab('history');
        setShowHistory(true);
      }}
    >
      <span className="mobile-nav-icon">📚</span>
      <span className="mobile-nav-label">Chats</span>
    </button>
    <button
      className={`mobile-nav-item ${mobileActiveTab === 'kb' ? 'active' : ''}`}
      onClick={() => {
        setMobileActiveTab('kb');
        navigate('/knowledge-base');
      }}
    >
      <span className="mobile-nav-icon">📓</span>
      <span className="mobile-nav-label">Notes</span>
    </button>
    <button
      className={`mobile-nav-item ${mobileActiveTab === 'profile' ? 'active' : ''}`}
      onClick={() => {
        setMobileActiveTab('profile');
        setShowProfile(true);
      }}
    >
      <span className="mobile-nav-icon">👤</span>
      <span className="mobile-nav-label">Profile</span>
    </button>
  </nav>
)}
```

## Mobile Bottom Navigation CSS

```css
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(135deg, #ff6b9d, #ff8a65);
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .mobile-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s;
    padding: 8px 4px;
    gap: 2px;
  }

  .mobile-nav-item.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
  }

  .mobile-nav-item:active {
    background: rgba(255, 255, 255, 0.2);
  }

  .mobile-nav-icon {
    font-size: 22px;
    line-height: 1;
  }

  .mobile-nav-label {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}
```

## State Variables Required

```tsx
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
const [mobileActiveTab, setMobileActiveTab] = useState<'chat' | 'morgys' | 'history' | 'kb' | 'profile'>('chat');
const [showHistory, setShowHistory] = useState(false);
const [showProfile, setShowProfile] = useState(false);

// Handle window resize for mobile detection
useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Working Build Files
- working-build-803d2300.js - Full minified JS
- working-build-803d2300.css - Full minified CSS
