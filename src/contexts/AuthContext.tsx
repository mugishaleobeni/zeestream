import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider } from '@/lib/firebase';
import { db } from '@/lib/firebase'; // Firestore instance
import { useToast } from '@/hooks/use-toast';

// --- UserProfile interface remains the same (assuming it's in a separate file) ---
// export interface UserProfile {
//   uid: string;
//   email: string;
//   displayName?: string;
//   photoURL?: string;
//   createdAt: Date;
//   likedMovies: string[];
//   role: 'user' | 'admin';
// }

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const createUserDocument = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Define your default values
      const defaultDisplayName = user.email ? user.email.split('@')[0] : 'New User'; // Use part of email as default
      const defaultPhotoURL = 'https://res.cloudinary.com/ddjprb8uw/image/upload/v1752570172/femaleavatar_dq6pk4.jpg';

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        // Set displayName: use user.displayName if it exists (e.g., from Google), otherwise use a default
        displayName: user.displayName || defaultDisplayName,
        // Set photoURL: use user.photoURL if it exists (e.g., from Google), otherwise use the specified default avatar
        photoURL: user.photoURL || defaultPhotoURL,
        createdAt: serverTimestamp(),
        likedMovies: [],
        role: 'user', // Default role
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      // createUserDocument will handle setting defaults if they don't exist
      await createUserDocument(res.user); 
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      throw error; 
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      // createUserDocument will handle setting defaults and the specific photoURL for email/password sign-ups
      await createUserDocument(res.user); 
      toast({
        title: "Account created!",
        description: "Welcome to Zeestream!",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Google provides its own displayName and photoURL, createUserDocument will prioritize these
      await createUserDocument(result.user); 
      toast({
        title: "Welcome!",
        description: "You've successfully signed in with Google.",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Goodbye!",
        description: "You've been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};