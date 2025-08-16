import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Chrome } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }

      onOpenChange(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      // --- START: ADDED CONSOLE LOGS FOR DEBUGGING ---
      console.error("Firebase Auth Error Object:", error);
      console.error("Error Code Received:", error.code);
      console.error("Error Message Received:", error.message);
      // --- END: ADDED CONSOLE LOGS FOR DEBUGGING ---

      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorTitle = 'Authentication Failed';

      // Check for specific Firebase Auth error codes
      if (error.code) {
        switch (error.code) {
          // Group these common "incorrect login attempt" errors for security
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // This is the key addition for generic "invalid credentials"
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address provided is not valid.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Your account has been disabled. Please contact support.';
            break;
          case 'auth/email-already-in-use':
            errorTitle = 'Account Exists';
            errorMessage = 'An account with this email already exists. Please sign in instead.';
            break;
          case 'auth/weak-password':
            errorTitle = 'Password Too Weak';
            errorMessage = 'The password must be at least 6 characters long.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed login attempts. Please try again later.';
            break;
          default:
            errorMessage = error.message; // Fallback to Firebase's default message
            break;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Google Sign-In Failed',
        description: error.message || 'An error occurred during Google Sign-In.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox to reset your password. If you don\'t see it, please check your spam or junk folder. Don\'t worry, it\'s on its way!',
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          default:
            errorMessage = error.message;
            break;
        }
      }
      toast({
        title: 'Error sending reset email',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {showForgotPassword
              ? 'Reset Password'
              : isLogin
              ? 'Welcome back'
              : 'Create account'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForgotPassword && (
            <>
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!showForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {showForgotPassword ? (
              <Button
                type="button"
                className="w-full btn-stream"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full btn-stream"
                disabled={loading}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            )}
          </form>

          <div className="text-center text-sm flex flex-col space-y-2">
            {!showForgotPassword && isLogin && (
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setIsLogin(!isLogin);
              }}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {showForgotPassword
                ? 'Back to sign in'
                : isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};