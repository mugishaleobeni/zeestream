import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { User, Mail, Calendar, LogOut, Trash2, Edit } from 'lucide-react'; // Removed Heart and MessageCircle as they are no longer used here
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deleteUser, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore'; // Import getDoc, deleteDoc, AND Timestamp
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/movie'; // Assuming UserProfile is in types/movie

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  // userProfile state is no longer strictly needed if likedMovies count is removed,
  // but keeping it for other potential profile data. If no other data is used from it,
  // it could be removed entirely along with its useEffect.
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch user profile data from Firestore (still useful for other profile fields like photoURL, role etc.)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: data.displayName || user.displayName || '',
              photoURL: data.photoURL || user.photoURL || '',
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
              likedMovies: Array.isArray(data.likedMovies) ? data.likedMovies : [], // Still fetch, but not displayed
              role: data.role || 'user',
            });
          } else {
            console.log("User profile document does not exist in Firestore.");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({
            title: 'Error',
            description: 'Failed to load user profile data.',
            variant: 'destructive',
          });
        }
      }
    };

    fetchUserProfile();
  }, [user, toast]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Update Firebase Auth
      await updateProfile(user, {
        displayName: displayName.trim() || undefined,
      });

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim() || null,
      });

      // Update local state (if userProfile is still used for other fields)
      setUserProfile(prev => prev ? { ...prev, displayName: displayName.trim() || '' } : null);

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      setEditing(false);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Delete user document from Firestore first
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);

      // Then delete user from Firebase Auth
      await deleteUser(user);
      
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      navigate('/');
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: 'Delete failed',
        description: error.message || 'You may need to sign in again before deleting your account.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Render nothing if user is not available (redirect will handle it)
  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Profile - Zeestream</title>
        <meta name="description" content="Manage your Zeestream profile and account settings" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{user.displayName || 'Anonymous User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Display Name</label>
                  {editing ? (
                    <div className="flex space-x-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className="flex-1"
                      />
                      <Button onClick={handleUpdateProfile} disabled={loading}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          setDisplayName(user.displayName || '');
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {user.displayName || 'Not set'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{user.email}</span>
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Member Since</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {user.metadata.creationTime
                        ? new Date(user.metadata.creationTime).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium">Sign Out</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={loading}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers, including your liked movies
                          and comments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
            {/* Removed the "Stats Card" section as requested */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
