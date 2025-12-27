import React from 'react';
import { MorgyCreatorWizard } from '../components/MorgyCreatorWizard';
import { useNavigate } from 'react-router-dom';

export const CreateMorgyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = (morgyId: string) => {
    // Navigate to the new Morgy's chat page
    navigate(`/chat/${morgyId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <MorgyCreatorWizard onComplete={handleComplete} />
    </div>
  );
};
