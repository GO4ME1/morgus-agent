import React from 'react';
import { EnhancedMorgyCreator } from '../components/EnhancedMorgyCreator';
import { CreatorNav } from '../components/CreatorNav';
import { MorgyStatsDashboard } from '../components/MorgyStatsDashboard';
import { QuickActionsPanel } from '../components/QuickActionsPanel';
import { useNavigate } from 'react-router-dom';

export const CreateMorgyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = (morgyData: unknown) => {
    // Navigate to the new Morgy's chat page or show success
    console.log('Morgy created:', morgyData);
    alert(`✅ Morgy "${morgyData.name}" created successfully!`);
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          marginBottom: '2rem', 
          textAlign: 'center',
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, #00d4aa, #00b4d8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎨 Custom Morgy Creator
        </h1>
        
        <CreatorNav />
        
        <MorgyStatsDashboard />
        
        <QuickActionsPanel />
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '2rem',
          marginTop: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ 
            marginBottom: '1.5rem',
            fontSize: '1.8rem'
          }}>
            ✨ Create New Morgy
          </h2>
          <p style={{
            opacity: 0.8,
            marginBottom: '2rem',
            fontSize: '1.1rem'
          }}>
            Build your custom AI agent in 5 easy steps. Add knowledge, customize personality, and choose how to use it!
          </p>
          <EnhancedMorgyCreator onComplete={handleComplete} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
};
