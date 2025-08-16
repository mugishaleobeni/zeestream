import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Home, Film, MessageCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SearchModal } from '@/components/modals/SearchModal';
import { AuthModal } from '@/components/modals/AuthModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const MobileNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      setShowAuth(true);
    }
  };

  return (
    <>
      {/* Top Mobile Navbar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-xl font-bold text-gradient">Zeestream</span>
          </Link>

          {/* Search Icon */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Bottom Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around h-16 px-4">
          <Link
            to="/"
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive('/') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            to="/movies"
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive('/movies') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-xs">Movies</span>
          </Link>

          <Link
            to="/chat"
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive('/chat') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Chat</span>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center space-y-1 text-muted-foreground">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="text-xs">Profile</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={handleProfileClick}
              className="flex flex-col items-center space-y-1 text-muted-foreground"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </button>
          )}
        </div>
      </nav>

      <SearchModal open={showSearch} onOpenChange={setShowSearch} />
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
};