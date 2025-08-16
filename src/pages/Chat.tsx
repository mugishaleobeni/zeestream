import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Send, Sparkles, User, ArrowLeft, Play, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateChatResponse, getGeminiModel } from '@/lib/gemini';
import { Movie } from '@/types/movie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/modals/AuthModal';
import { ChatSession } from '@google/generative-ai';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  movies?: Movie[];
  aiAction?: 'search_movies' | 'general_chat' | 'identity_response';
}

const MAX_ANON_INTERACTIONS = 5;

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiInteractionCount, setAiInteractionCount] = useState(0);
  const [movieContext, setMovieContext] = useState<Movie[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentInteractionLimit = user ? Infinity : MAX_ANON_INTERACTIONS;
  const canSendMessages = !loading && aiInteractionCount < currentInteractionLimit;

  useEffect(() => {
    try {
      const model = getGeminiModel();
      setChatSession(model.startChat({
        history: [],
        generationConfig: { maxOutputTokens: 500 },
      }));
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
      toast({
        title: "AI Initialization Error",
        description: "Could not start AI assistant.",
        variant: "destructive",
      });
    }
  }, []);

  useEffect(() => {
    const loadMovieContext = async () => {
      try {
        const moviesRef = collection(db, 'movies');
        const q = query(moviesRef, orderBy('uploadDate', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const movies: Movie[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.releaseDate instanceof Timestamp) {
            data.releaseDate = data.releaseDate.toDate();
          }
          if (data.uploadDate instanceof Timestamp) {
            data.uploadDate = data.uploadDate.toDate();
          }
          movies.push({ id: doc.id, ...data } as Movie);
        });
        setMovieContext(movies);
      } catch (error) {
        console.error('Error loading movie context:', error);
        toast({
          title: "Error Loading Movies",
          description: "Failed to load movie context. Try again later.",
          variant: "destructive",
        });
      }
    };

    loadMovieContext();
    setMessages([
      {
        id: 'welcome-1',
        content: user?.displayName
          ? `Hey ${user.displayName}! I'm Zee AI, your Zeestream movie assistant. Ask about movies or Zeestream!`
          : "Hi! I'm Zee AI, your Zeestream movie assistant. Ask about movies or Zeestream!",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatSession) {
      toast({
        title: "AI Not Ready",
        description: "AI assistant is initializing. Please wait.",
        variant: "destructive",
      });
      return;
    }
    if (!input.trim() || loading || !canSendMessages) {
      if (!canSendMessages && !loading) {
        toast({
          title: "Interaction Limit Reached",
          description: `Max ${MAX_ANON_INTERACTIONS} interactions reached. Please log in.`,
          variant: "destructive",
        });
      }
      return;
    }

    const userMessageContent = input.trim();
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessageContent,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await generateChatResponse(userMessageContent, movieContext, chatSession, user?.displayName);
      console.log('AI response received:', aiResponse); // Debug log

      // Clean up markdown symbols from AI response
      const cleanedText = aiResponse.text
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/\*/g, '') // Remove italic markdown
        .replace(/```json\s*```/g, '') // Remove empty json blocks
        .replace(/```\s*```/g, '') // Remove empty code blocks
        .trim();

      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: cleanedText,
        isUser: false,
        timestamp: new Date(),
        movies: aiResponse.movies || [], // Ensure movies array is defined
        aiAction: aiResponse.aiAction,
      };

      setMessages(prev => [...prev, newAiMessage]);
      setAiInteractionCount(prev => prev + 1);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble. Try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to get AI response.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie: Movie) => {
    navigate(`/watch/${movie.slug}`);
  };

  const handlePlayClick = (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/watch/${movie.slug}`);
  };

  const handleDownloadClick = (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation();
    if (movie.downloadUrl) {
      // Create a temporary link element for auto download
      const link = document.createElement('a');
      link.href = movie.downloadUrl;
      link.download = movie.name || 'movie';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${movie.name}...`,
        variant: "default",
      });
    } else {
      toast({
        title: "No Download URL",
        description: "This movie is not available for download yet.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !chatSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading AI chat...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Zee AI Assistant - Zeestream</title>
        <meta name="description" content="Chat with Zee AI to discover movies on Zeestream" />
      </Helmet>

      <div className="h-screen flex flex-col bg-background">
        <div className="border-b border-border p-4">
          <div className="container mx-auto flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-cycle" />
              </div>
              <div>
                <h1 className="font-semibold">Zee AI Assistant</h1>
                <p className="text-xs text-muted-foreground">
                  {user ? "Unlimited interactions" : `${aiInteractionCount}/${MAX_ANON_INTERACTIONS} interactions used`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="container mx-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.isUser ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`flex items-start space-x-3 ${
                      message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {message.isUser ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div
                        className={`p-3 rounded-lg ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.movies && message.movies.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          {message.movies.map((movie) => (
                            <Card
                              key={movie.id}
                              className="cursor-pointer hover:shadow-lg transition-all duration-300 group overflow-hidden"
                              onClick={() => handleMovieClick(movie)}
                            >
                              <CardContent className="p-0">
                                <div className="relative">
                                  <img
                                    src={movie.thumbnailUrl}
                                    alt={movie.name}
                                    className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  
                                  {/* Z-shaped overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  {/* Action buttons */}
                                  <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {movie.watchUrl && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="bg-black/70 text-white hover:bg-primary rounded-full w-8 h-8"
                                        onClick={(e) => handlePlayClick(movie, e)}
                                        title="Watch Now"
                                      >
                                        <Play className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {movie.downloadUrl && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="bg-black/70 text-white hover:bg-primary rounded-full w-8 h-8"
                                        onClick={(e) => handleDownloadClick(movie, e)}
                                        title="Download"
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>

                                  {/* Movie type badge */}
                                  <div className="absolute top-2 left-2">
                                    <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                                      {movie.type === 'translated' ? 'Dubbed' : 'Original'}
                                    </span>
                                  </div>

                                  {/* Coming soon badge */}
                                  {movie.comingSoon && (
                                    <div className="absolute bottom-2 left-2">
                                      <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                                        Coming Soon
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-3">
                                  <h4 className="font-semibold text-sm truncate mb-1">{movie.name}</h4>
                                  <p className="text-xs text-muted-foreground mb-2">{movie.category}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{movie.description}</p>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs text-yellow-500">★</span>
                                      <span className="text-xs font-medium">{movie.rating}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {movie.isSeries ? 'Series' : 'Movie'}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="container mx-auto">
            {user ? (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about movies or Zeestream!"
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <>
                {canSendMessages ? (
                  <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask about movies (${MAX_ANON_INTERACTIONS - aiInteractionCount} questions left)`}
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !input.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      You've used all {MAX_ANON_INTERACTIONS} questions for this session.
                    </p>
                  </div>
                )}
                <div className="text-center mt-4">
                  <p className="text-muted-foreground mb-2">
                    Sign in for unlimited chat and personalized experience.
                  </p>
                  <Button onClick={() => setShowAuthModal(true)} className="btn-stream">
                    Login / Register
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};
export default Chat;