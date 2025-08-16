import React, { useState } from 'react';
import { Play, Download, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom'; // Use Link for navigation to watch page
import { Movie } from '@/types/movie';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Import Card and CardContent

interface MovieCardProps {
  movie: Movie;
  onAuthRequired: () => void;
  onDownloadClick: (url: string | undefined, name: string) => void; // Added onDownloadClick prop
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onAuthRequired, onDownloadClick }) => {
  const { user } = useAuth();
  // We use Link for navigation directly, so useNavigate is less critical here for card clicks
  // const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  // The handlePlay on the card now just navigates to the watch page
  // The in-page video play logic is handled on the Watch component itself.
  const handleCardPlayClick = () => {
    // This will navigate to the watch page where the video player is.
    // The actual video playback is handled by the Watch component's handlePlay.
  };

  const handleLike = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    // TODO: Implement like functionality (this logic should ideally be lifted up
    // to a parent component or a global state/context if likes are shared across pages,
    // or fetched/updated specifically for this card if it's self-contained).
    // For now, it just triggers auth modal if not logged in.
  };

  const handleComment = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    // This will navigate to the watch page and scroll to comments section
    window.location.href = `/watch/${movie.slug}#comments`;
  };

  return (
    <Card className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Link wraps the image for navigation to the watch page */}
      <Link to={`/watch/${movie.slug}`} className="block">
        <div className="relative aspect-[2/3] w-full">
          {/* Thumbnail */}
          <img
            src={movie.thumbnailUrl}
            alt={movie.name}
            className={`w-full h-full object-cover rounded-t-lg transition-opacity duration-300 group-hover:scale-105 transition-transform ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/200x300/E0E0E0/333333?text=No+Image';
              setImageLoaded(true); // Ensure shimmer disappears even on error
            }}
          />

          {/* Loading shimmer */}
          {!imageLoaded && (
            <div className="absolute inset-0 loading-shimmer rounded-lg" />
          )}

          {/* Movie overlay on hover (Play & Download buttons) */}
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card navigation
                  // Navigate to watch page to play the video
                  window.location.href = `/watch/${movie.slug}`;
                }}
              >
                <Play className="w-6 h-6 fill-current text-primary" />
              </Button>
              {movie.downloadUrl && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card navigation
                    onDownloadClick(movie.downloadUrl, movie.name);
                  }}
                >
                  <Download className="w-6 h-6 fill-current text-primary" />
                </Button>
              )}
            </div>
          </div>

          {/* Coming Soon Badge */}
          {movie.comingSoon && (
            <div className="absolute top-2 right-2 z-30 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
              Coming Soon
            </div>
          )}

          {/* Series Badge */}
          {movie.isSeries && (
            <div className="absolute bottom-2 left-2 z-30 bg-black/60 text-white px-2 py-1 rounded text-xs">
              Series
            </div>
          )}
        </div>
      </Link> {/* End of Link for the image */}

      {/* Movie Info and Action buttons */}
      <CardContent className="p-3 space-y-2">
        <h3 className="font-medium truncate">{movie.name}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{movie.category}</span>
          <div className="flex items-center space-x-2">
            <span>★ {movie.rating}</span>
          </div>
        </div>

        {/* Action buttons (Like, Comment) */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-3 text-sm">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>{movie.likes.length}</span> {/* Corrected: Display length of the array */}
            </button>
            <button
              onClick={handleComment}
              className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{movie.comments.length}</span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground">
            {movie.type === 'translated' ? 'Dubbed' : 'Original'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
