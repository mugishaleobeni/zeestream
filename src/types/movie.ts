export interface Movie {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  type: 'original' | 'translated';
  category: string;
  likes: string[]; // Array of user UIDs who liked the movie
  comments: Comment[];
  rating: number;
  uploadDate: Date;
  description: string;
  trailerUrl: string;
  isSeries: boolean;
  relationship: string; // Used to group series or movies
  comingSoon: boolean;
  releaseDate?: Date;
  translator?: string;
  watchUrl: string;
  downloadUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  likedMovies: string[];
  role: 'user' | 'admin';
}
