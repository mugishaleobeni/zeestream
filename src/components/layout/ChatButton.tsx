import React from 'react';
import { Sparkles } from 'lucide-react'; // Directly importing Sparkles
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const ChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on chat page
  if (location.pathname === '/chat') return null;

  return (
    <Button
      onClick={() => navigate('/chat')}
      className="fixed bottom-[5rem] right-6 z-50 w-auto h-[2rem] rounded-full btn-stream chat-bounce shadow-glow"
      size="lg"
      aria-label="Open AI Chat"
    >
      <Sparkles className="w-6 h-6" /> ask AI
    </Button>
  );
};