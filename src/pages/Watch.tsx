import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play, Download, Heart, MessageCircle, Star, Calendar, User } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Movie, Comment } from '@/types/movie'; // Importing Movie and Comment types
import { AuthModal } from '@/components/modals/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const MOVIES_IN_RELATIONSHIP_SECTION = 24;
const OTHER_CATEGORY_MOVIES_LIMIT = 10;

const Watch = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement>(null);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedGroupMovies, setRelatedGroupMovies] = useState<Movie[]>([]);
  const [otherCategoryMovies, setOtherCategoryMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // Tracks if current user liked the movie
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const mapMovieDoc = useCallback((doc: any): Movie => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      slug: data.slug || '',
      thumbnailUrl: data.thumbnailUrl || 'https://placehold.co/200x300/E0E0E0/333333?text=No+Image',
      type: data.type || 'original',
      category: data.category || 'Uncategorized',
      // Ensure likes is an array of strings (user UIDs)
      likes: Array.isArray(data.likes) ? data.likes : [],
      comments: data.comments?.map((comment: any) => ({
        id: comment.id || crypto.randomUUID(),
        userId: comment.userId || '',
        userEmail: comment.userEmail || '',
        content: comment.content || '',
        timestamp: comment.timestamp instanceof Timestamp ? comment.timestamp.toDate() : new Date(),
      })) || [],
      rating: data.rating || 0,
      uploadDate: data.uploadDate instanceof Timestamp ? data.uploadDate.toDate() : new Date(),
      description: data.description || '',
      trailerUrl: data.trailerUrl || '',
      isSeries: data.isSeries || false,
      relationship: data.relationship || '',
      comingSoon: data.comingSoon || false,
      releaseDate: data.releaseDate instanceof Timestamp ? data.releaseDate.toDate() : undefined,
      translator: data.translator || undefined,
      watchUrl: data.watchUrl || '',
      downloadUrl: data.downloadUrl || undefined,
    };
  }, []);

  const logAllMovies = async () => {
    try {
      const moviesRef = collection(db, 'movies');
      const querySnapshot = await getDocs(moviesRef);
      const movies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('All Movies in Firestore:', JSON.stringify(movies, null, 2));
    } catch (error) {
      console.error('Error fetching all movies for debugging:', error);
    }
  };

  useEffect(() => {
    const loadMovieAndContent = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const moviesRef = collection(db, 'movies');
        let currentMovieData = null;

        await logAllMovies();

        const q = query(moviesRef, where('slug', '==', slug), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log(`Movie with slug "${slug}" not found in DB.`);
          navigate('/404');
          return;
        }

        const movieDoc = querySnapshot.docs[0];
        currentMovieData = mapMovieDoc(movieDoc);
        setMovie(currentMovieData);
        console.log('Current movie:', { id: currentMovieData.id, name: currentMovieData.name, relationship: currentMovieData.relationship });

        // Set isLiked based on whether the current user's UID is in the likes array
        setIsLiked(user ? currentMovieData.likes.includes(user.uid) : false);

        let fetchedRelatedGroupData = [];
        if (currentMovieData.relationship && currentMovieData.relationship.trim() !== '') {
          console.log(`Fetching related movies for relationship: "${currentMovieData.relationship}"`);
          const relatedGroupQuery = query(
            moviesRef,
            where('relationship', '==', currentMovieData.relationship),
            orderBy('name', 'asc'),
            limit(MOVIES_IN_RELATIONSHIP_SECTION)
          );
          const relatedGroupSnapshot = await getDocs(relatedGroupQuery);
          fetchedRelatedGroupData = relatedGroupSnapshot.docs
            .map(mapMovieDoc)
            .filter(movie => movie.id !== currentMovieData.id);
          console.log('Related movies fetched:', fetchedRelatedGroupData.map(m => ({ id: m.id, name: m.name, relationship: m.relationship })));
          setRelatedGroupMovies(fetchedRelatedGroupData);
          if (fetchedRelatedGroupData.length === 0) {
            console.warn(`No related movies found for relationship: "${currentMovieData.relationship}"`);
          }
        } else {
          setRelatedGroupMovies([]);
          console.log('No valid relationship defined for current movie:', currentMovieData.name);
        }

        console.log(`Fetching other movies in category: "${currentMovieData.category}"`);
        const otherCategoryQuery = query(
          moviesRef,
          where('category', '==', currentMovieData.category),
          orderBy('uploadDate', 'desc'),
          limit(MOVIES_IN_RELATIONSHIP_SECTION * 2)
        );
        const otherCategorySnapshot = await getDocs(otherCategoryQuery);
        const fetchedOtherCategoryMovies = otherCategorySnapshot.docs
          .map(mapMovieDoc)
          .filter(m =>
            m.id !== currentMovieData.id &&
            !fetchedRelatedGroupData.some(rm => rm.id === m.id)
          )
          .slice(0, OTHER_CATEGORY_MOVIES_LIMIT);
        setOtherCategoryMovies(fetchedOtherCategoryMovies);
        console.log('Other category movies fetched:', fetchedOtherCategoryMovies.map(m => m.name));

      } catch (error) {
        console.error('Error loading movie or related content:', (error as Error).message, (error as any).code);
        if ((error as any).code === 'failed-precondition') {
          console.error('Firestore Error: Missing index. Please create an index for collection "movies" with fields: relationship (Ascending), name (Ascending), category (Ascending), and uploadDate (Descending). Check Firebase Console for the exact link.');
        } else if ((error as any).code === 'permission-denied') {
          console.error('Firestore Error: Permission denied. Check Firestore security rules for the "movies" collection.');
        }
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    loadMovieAndContent();
  }, [slug, navigate, user, mapMovieDoc]);

  const validateCommentContent = (content: string): { isValid: boolean; message: string } => {
    const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (scriptRegex.test(content)) {
      return { isValid: false, message: "Script tags are not allowed." };
    }

    const longNumberRegex = /(?:\b\d{5,}\b|\b\d{4}\s?\d+\b)/g;
    if (longNumberRegex.test(content)) {
      return { isValid: false, message: "Numbers with more than 4 digits are not allowed." };
    }

    const urlRegex = /(https?:\/\/[^\s]+|\bwww\.[^\s]+\b|(?:\w+\.)(?:com|net|org|io|co|xyz|info|biz|app|me|us|tv|fm|ly|dev|ai)\b)/gi;
    if (urlRegex.test(content)) {
      return { isValid: false, message: "Links or URLs are not allowed." };
    }

    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    if (emailRegex.test(content)) {
      return { isValid: false, message: "Email addresses are not allowed." };
    }

    return { isValid: true, message: "" };
  };

  const handleCommentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    const { isValid, message } = validateCommentContent(value);

    if (isValid || value.length < newCommentContent.length) {
      setNewCommentContent(value);
    } else {
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    if (!user) {
      setShowAuthModal(true); // Prompt user to sign in if not authenticated
      return;
    }
    if (!movie) return; // Ensure movie data is available

    try {
      const movieRef = doc(db, 'movies', movie.id);
      let updatedLikes: string[];

      if (isLiked) {
        // If already liked, remove user's UID
        updatedLikes = movie.likes.filter((uid: string) => uid !== user.uid);
      } else {
        // If not liked, add user's UID
        updatedLikes = [...movie.likes, user.uid];
      }

      await updateDoc(movieRef, { likes: updatedLikes }); // Update Firestore
      setMovie(prevMovie => prevMovie ? { ...prevMovie, likes: updatedLikes } : null); // Update local state
      setIsLiked(!isLiked); // Toggle liked status

      toast({
        title: "Success",
        description: isLiked ? "Movie unliked!" : "Movie liked!",
      });
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!movie || !newCommentContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const { isValid, message } = validateCommentContent(newCommentContent.trim());
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setSubmittingComment(true);
    try {
      const movieRef = doc(db, 'movies', movie.id);
      const newComment = {
        id: crypto.randomUUID(),
        userId: user.uid,
        userEmail: user.email || 'Anonymous User',
        content: newCommentContent.trim(),
        timestamp: new Date(),
      };

      const updatedComments = [...movie.comments, newComment].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      await updateDoc(movieRef, { comments: updatedComments });
      setMovie(prevMovie => prevMovie ? { ...prevMovie, comments: updatedComments } : null);
      setNewCommentContent('');
      toast({
        title: "Success",
        description: "Comment posted successfully!",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handler for direct download (reusable)
  const handleDirectDownload = (url: string | undefined, name: string) => {
    if (!url) {
      toast({
        title: "Download Error",
        description: "No download URL available for this item.",
        variant: "destructive",
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.mp4`); // Suggest a filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download Initiated",
        description: "Your download should start shortly. If not, check your browser's download settings.",
      });
    } catch (error) {
      console.error('Error initiating download:', error);
      toast({
        title: "Download Failed",
        description: "Could not initiate download. This might be due to external link restrictions.",
        variant: "destructive",
      });
    }
  };

  // New handler for in-page video play
  const handlePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
          toast({
            title: "Playback Error",
            description: "Could not play video automatically. Please click the play button on the video player.",
            variant: "destructive",
          });
        });
      } else {
        videoRef.current.pause();
      }
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      toast({
        title: "Playback Error",
        description: "Video player not found.",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="aspect-video bg-gray-200 animate-pulse rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
              <div className="h-20 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 animate-pulse rounded w-1/2" />
              <div className="h-32 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const currentVideoUrl = movie.watchUrl || movie.trailerUrl;
  const currentVideoThumbnail = movie.thumbnailUrl;

  return (
    <>
      <Helmet>
        <title>{movie.name} - Watch on Zeestream</title>
        <meta name="description" content={movie.description} />
        <meta property="og:title" content={`${movie.name} - Zeestream`} />
        <meta property="og:description" content={movie.description} />
        <meta property="og:image" content={movie.thumbnailUrl} />
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:site_name" content="Zeestream" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`${movie.name} - Zeestream`} />
        <meta name="twitter:description" content={movie.description} />
        <meta name="twitter:image" content={movie.thumbnailUrl} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Main Content Grid: Video (Left, 50%) and Details/Collections (Right, 50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Main Video Player */}
          <div className="aspect-video bg-black rounded-xl overflow-hidden">
            {currentVideoUrl ? (
              <video
                ref={videoRef} // Attach ref to video element
                controls
                className="w-full h-full"
                poster={currentVideoThumbnail}
                src={currentVideoUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-lg rounded-xl">
                Video not available or invalid URL. Please check watchUrl/trailerUrl in database.
              </div>
            )}
          </div>

          {/* Right Column: Details and Your Collections */}
          <div className="space-y-6">
            {/* Details Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Genre:</span>
                    <span className="capitalize">{movie.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <span>★ {movie.rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{movie.type === 'translated' ? 'Dubbed' : 'Original'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upload Date:</span>
                    <span>{new Date(movie.uploadDate).toLocaleDateString()}</span>
                  </div>
                  {movie.comingSoon && movie.releaseDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Release Date:</span>
                      <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collection:</span>
                    <span>{movie.relationship || 'None'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Collections Section - Displaying movies from the same relationship group */}
            {relatedGroupMovies.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Collections</h3>
                  <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {relatedGroupMovies.map((relatedMovie) => (
                      <div
                        key={relatedMovie.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/watch/${relatedMovie.slug}`)}
                      >
                        <img
                          src={relatedMovie.thumbnailUrl}
                          alt={relatedMovie.name}
                          className="w-[60px] h-[90px] object-cover rounded-md flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/60x90/E0E0E0/333333?text=No+Image';
                          }}
                        />
                        <div className="flex-grow">
                          <span className="text-sm font-medium line-clamp-2">{relatedMovie.name}</span>
                          <div className="flex items-center space-x-2 mt-1"> {/* Flex container for buttons */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto text-primary hover:text-primary/80"
                              onClick={(e) => { e.stopPropagation(); navigate(`/watch/${relatedMovie.slug}`); }}
                            >
                              <Play className="w-4 h-4 mr-1" /> Play
                            </Button>
                            {relatedMovie.downloadUrl && ( // Conditionally render download button
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-auto text-muted-foreground hover:text-primary/80"
                                onClick={(e) => { e.stopPropagation(); handleDirectDownload(relatedMovie.downloadUrl, relatedMovie.name); }}
                              >
                                <Download className="w-4 h-4 mr-1" /> Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Movie Title, Metadata, Description, and Action Buttons (Below video on larger screens) */}
        <div className="lg:col-span-2 space-y-6 mt-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">{movie.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{movie.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(movie.uploadDate).getFullYear()}</span>
              </div>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                {movie.category}
              </span>
              <span className="px-2 py-1 bg-muted rounded text-xs">
                {movie.type === 'translated' ? 'Dubbed' : 'Original'}
              </span>
              {movie.isSeries && (
                <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs">
                  Series
                </span>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              {movie.description}
            </p>

            <div className="flex items-center space-x-4 mb-6">
              {/* Play button now controls the in-page video player */}
              <Button className="btn-stream" onClick={handlePlay} disabled={!currentVideoUrl}>
                <Play className="w-4 h-4 mr-2" />
                {currentVideoUrl ? 'Play' : 'No Play Link'}
              </Button>

              {/* Download button now triggers direct download */}
              <Button variant="outline" onClick={() => handleDirectDownload(movie.downloadUrl, movie.name)} disabled={!movie.downloadUrl}>
                <Download className="w-4 h-4 mr-2" />
                {movie.downloadUrl ? 'Download' : 'No Download Link'}
              </Button>

              <Button variant="ghost" onClick={handleLike} className={isLiked ? 'text-red-500' : ''}>
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-red-500' : ''}`} />
                {movie.likes.length} {/* Like count from array length */}
              </Button>
              <Button variant="ghost" onClick={() => user ? null : setShowAuthModal(true)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                {movie.comments.length}
              </Button>
            </div>

            {movie.translator && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Translated by: {movie.translator}</span>
              </div>
            )}
          </div>

          {/* Comments Section for the current movie */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comments ({movie.comments.length})</h3>
              <form onSubmit={handlePostComment} className="mb-6 space-y-3">
                <Textarea
                  placeholder={user ? "Write your comment here..." : "Sign in to post a comment..."}
                  value={newCommentContent}
                  onChange={handleCommentInputChange}
                  disabled={!user || submittingComment}
                  rows={3}
                />
                <Button type="submit" disabled={!user || submittingComment}>
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </form>

              {movie.comments.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {/* Displaying only the top 10 most recent comments */}
                  {movie.comments.slice(0, 10).map((comment) => (
                    <div key={comment.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{comment.userEmail}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Other Movies in This Category Section - Modified to "Suggestion" */}
        {otherCategoryMovies.length > 0 && (
          <section className="container mx-auto px-4 mt-12">
            <h2 className="text-2xl font-bold mb-6">Suggestion</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {otherCategoryMovies.map((otherMovie) => (
                <Card
                  key={otherMovie.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(`/watch/${otherMovie.slug}`)}
                >
                  <img
                    src={otherMovie.thumbnailUrl}
                    alt={otherMovie.name}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/200x300/E0E0E0/333333?text=No+Image';
                    }}
                  />
                  <CardContent className="p-3">
                    <h4 className="text-sm font-semibold mb-1 line-clamp-2">
                      {otherMovie.name}
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="w-3 h-3 mr-1 text-yellow-500" />
                      <span>{otherMovie.rating.toFixed(1)}</span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full w-12 h-12"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/watch/${otherMovie.slug}`);
                        }}
                      >
                        <Play className="w-6 h-6 fill-current text-primary" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};

export default Watch;
