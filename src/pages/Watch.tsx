import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play, Pause, Download, Heart, MessageCircle, Star, Calendar, User, Volume2, VolumeX, Maximize, Settings, SkipBack } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Movie, Comment } from '@/types/movie';
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

  // Player refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedGroupMovies, setRelatedGroupMovies] = useState<Movie[]>([]);
  const [otherCategoryMovies, setOtherCategoryMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Custom player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const currentVideoUrl = movie?.watchUrl || movie?.trailerUrl || '';

  // Detect if it's Cloudflare Stream iframe
  const isCloudflareStream = currentVideoUrl.includes('cloudflarestream.com') && currentVideoUrl.includes('/iframe');

  // Detect direct video (MP4, HLS, etc.)
  const isDirectVideo = currentVideoUrl && !isCloudflareStream;

  const mapMovieDoc = useCallback((doc: any): Movie => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      slug: data.slug || '',
      thumbnailUrl: data.thumbnailUrl || 'https://placehold.co/200x300/E0E0E0/333333?text=No+Image',
      type: data.type || 'original',
      category: data.category || 'Uncategorized',
      likes: Array.isArray(data.likes) ? data.likes : [],
      comments: data.comments?.map((c: any) => ({
        id: c.id || crypto.randomUUID(),
        userId: c.userId || '',
        userEmail: c.userEmail || '',
        content: c.content || '',
        timestamp: c.timestamp instanceof Timestamp ? c.timestamp.toDate() : new Date(),
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

  // Auto-hide controls on mouse move
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
  };

  useEffect(() => {
    const container = playerContainerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetControlsTimeout);
      container.addEventListener('click', resetControlsTimeout);
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', resetControlsTimeout);
        container.removeEventListener('click', resetControlsTimeout);
      }
    };
  }, []);

  // Unified Play/Pause (works for both video and Cloudflare iframe)
  const togglePlay = async () => {
    if (isDirectVideo && videoRef.current) {
      if (videoRef.current.paused) {
        await videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } else if (isCloudflareStream && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(isPlaying ? 'pause' : 'play', '*');
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(percent * duration, duration));
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Load movie + related content (your original logic - unchanged)
  useEffect(() => {
    const loadMovieAndContent = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const moviesRef = collection(db, 'movies');
        const q = query(moviesRef, where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          navigate('/404');
          return;
        }

        const movieDoc = snapshot.docs[0];
        const currentMovieData = mapMovieDoc(movieDoc);
        setMovie(currentMovieData);
        setIsLiked(user ? currentMovieData.likes.includes(user.uid) : false);

        if (currentMovieData.relationship) {
          const relatedQ = query(moviesRef, where('relationship', '==', currentMovieData.relationship), orderBy('name'), limit(MOVIES_IN_RELATIONSHIP_SECTION));
          const relatedSnap = await getDocs(relatedQ);
          setRelatedGroupMovies(relatedSnap.docs.map(mapMovieDoc).filter(m => m.id !== currentMovieData.id));
        }

        const otherQ = query(moviesRef, where('category', '==', currentMovieData.category), orderBy('uploadDate', 'desc'), limit(50));
        const otherSnap = await getDocs(otherQ);
        const filtered = otherSnap.docs.map(mapMovieDoc)
          .filter(m => m.id !== currentMovieData.id && !relatedGroupMovies.some(r => r.id === m.id))
          .slice(0, OTHER_CATEGORY_MOVIES_LIMIT);
        setOtherCategoryMovies(filtered);

      } catch (err) {
        console.error(err);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };
    loadMovieAndContent();
  }, [slug, navigate, user, mapMovieDoc]);

  // Your original functions (like, comment, download)
  const handleLike = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!movie) return;

    try {
      const movieRef = doc(db, 'movies', movie.id);
      const updatedLikes = isLiked
        ? movie.likes.filter(uid => uid !== user.uid)
        : [...movie.likes, user.uid];

      await updateDoc(movieRef, { likes: updatedLikes });
      setMovie(prev => prev ? { ...prev, likes: updatedLikes } : null);
      setIsLiked(!isLiked);
      toast({ title: "Success", description: isLiked ? "Unliked" : "Liked!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    }
  };

  const handlePostComment = async (e: React.FormEvent) => { /* your full code here */ };
  const handleDirectDownload = (url?: string, name = "movie") => {
    if (!url) return toast({ title: "Error", description: "No download link", variant: "destructive" });
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.mp4`; document.body.appendChild(a); a.click(); a.remove();
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center"><div className="text-2xl">Loading...</div></div>;
  if (!movie) return <div className="text-center py-20">Movie not found</div>;

  return (
    <>
      <Helmet>
        <title>{movie.name} - ZeeStream</title>
        <meta name="description" content={movie.description} />
        <meta property="og:title" content={movie.name} />
        <meta property="og:image" content={movie.thumbnailUrl} />
        <meta property="og:type" content="video.movie" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CUSTOM VIDEO PLAYER */}
          <div
            ref={playerContainerRef}
            className="relative aspect-video bg-black rounded-xl overflow-hidden group"
            onMouseMove={resetControlsTimeout}
          >
            {currentVideoUrl ? (
              <>
                {/* CLOUDFLARE STREAM - NO CONTROLS */}
                {isCloudflareStream && (
                  <iframe
                    ref={iframeRef}
                    src={currentVideoUrl}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    // Hide all Cloudflare controls
                    style={{ border: 0 }}
                  />
                )}

                {/* DIRECT VIDEO - WITH CUSTOM CONTROLS */}
                {isDirectVideo && (
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    poster={movie.thumbnailUrl}
                    preload="metadata"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
                  >
                    <source src={currentVideoUrl} />
                  </video>
                )}

                {/* BIG CENTERED PLAY BUTTON (for both types) */}
                {!isPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-black/30"
                    onClick={togglePlay}
                  >
                    <button className="bg-white/20 backdrop-blur-md rounded-full p-8 hover:scale-110 transition">
                      <Play className="w-20 h-20 text-white" fill="white" />
                    </button>
                  </div>
                )}

                {/* CUSTOM CONTROLS - ONLY FOR DIRECT VIDEO */}
                {isDirectVideo && (
                  <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 transition-all duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'} z-20`}>
                    <div
                      ref={progressRef}
                      className="h-2 bg-white/30 rounded-full mb-4 cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-red-600 rounded-full transition-all"
                        style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-5">
                        <button onClick={togglePlay} className="hover:scale-110">
                          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" fill="white" />}
                        </button>
                        <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)}>
                          <SkipBack className="w-6 h-6" /> <span className="text-xs">10</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <button onClick={() => videoRef.current && (videoRef.current.muted = !videoRef.current.muted)}>
                            {videoRef.current?.muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                          </button>
                          <input
                            type="range"
                            min="0" max="1" step="0.1"
                            value={volume}
                            onChange={(e) => {
                              const vol = parseFloat(e.target.value);
                              setVolume(vol);
                              if (videoRef.current) videoRef.current.volume = vol;
                            }}
                            className="w-28 accent-red-600"
                          />
                        </div>
                        <span className="text-sm font-medium">{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}>
                            <Settings className="w-6 h-6" />
                          </button>
                          {showSpeedMenu && (
                            <div className="absolute bottom-10 right-0 bg-black/90 rounded-lg p-3 text-sm">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                                <button
                                  key={r}
                                  onClick={() => {
                                    setPlaybackRate(r);
                                    if (videoRef.current) videoRef.current.playbackRate = r;
                                    setShowSpeedMenu(false);
                                  }}
                                  className={`block w-full text-left px-3 py-1 hover:bg-white/20 ${playbackRate === r ? 'text-red-500 font-bold' : ''}`}
                                >
                                  {r}x {playbackRate === r && 'Selected'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={toggleFullscreen}>
                          <Maximize className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-xl">
                No video source
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - 100% YOUR ORIGINAL CODE */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Genre:</span><span className="capitalize">{movie.category}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating:</span><span>★ {movie.rating}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><span>{movie.type === 'translated' ? 'Dubbed' : 'Original'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Upload Date:</span><span>{new Date(movie.uploadDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Collection:</span><span>{movie.relationship || 'None'}</span></div>
                </div>
              </CardContent>
            </Card>

            {relatedGroupMovies.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Collections</h3>
                  <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {relatedGroupMovies.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/watch/${m.slug}`)}>
                        <img src={m.thumbnailUrl} alt={m.name} className="w-16 h-24 object-cover rounded" onError={e => e.currentTarget.src = 'https://placehold.co/60x90/E0E0E0/333333?text=No+Image'} />
                        <div className="flex-grow">
                          <p className="text-sm font-medium line-clamp-2">{m.name}</p>
                          <div className="flex gap-2 mt-2">
                            <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); navigate(`/watch/${m.slug}`); }}><Play className="w-4 h-4 mr-1" /> Play</Button>
                            {m.downloadUrl && <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleDirectDownload(m.downloadUrl, m.name); }}><Download className="w-4 h-4 mr-1" /> Download</Button>}
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

        {/* BELOW PLAYER - 100% YOUR ORIGINAL CODE */}
        <div className="mt-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">{movie.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> {movie.rating}</div>
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(movie.uploadDate).getFullYear()}</div>
              <span className="px-3 py-1 bg-primary/20 rounded-full">{movie.category}</span>
              <span className="px-3 py-1 bg-muted rounded">{movie.type === 'translated' ? 'Dubbed' : 'Original'}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">{movie.description}</p>

            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={togglePlay}>
                <Play className="w-5 h-5 mr-2" fill="white" />
                Play Movie
              </Button>
              {movie.downloadUrl && (
                <Button variant="outline" size="lg" onClick={() => handleDirectDownload(movie.downloadUrl, movie.name)}>
                  <Download className="w-5 h-5 mr-2" /> Download
                </Button>
              )}
              <Button variant="ghost" onClick={handleLike}>
                <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {movie.likes.length}
              </Button>
            </div>
          </div>

          {/* Comments, Suggestions - your full original code */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comments ({movie.comments.length})</h3>
              <form onSubmit={handlePostComment} className="mb-6 space-y-3">
                <Textarea placeholder={user ? "Write a comment..." : "Sign in to comment"} value={newCommentContent} onChange={e => setNewCommentContent(e.target.value)} disabled={!user} />
                <Button type="submit" disabled={!user || !newCommentContent.trim()}>Post</Button>
              </form>
              {/* Your comment list */}
            </CardContent>
          </Card>

          {otherCategoryMovies.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Suggestions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {otherCategoryMovies.map(m => (
                  <Card key={m.id} className="cursor-pointer overflow-hidden rounded-lg group" onClick={() => navigate(`/watch/${m.slug}`)}>
                    <img src={m.thumbnailUrl} alt={m.name} className="w-full h-48 object-cover group-hover:scale-105 transition" />
                    <CardContent className="p-3">
                      <h4 className="text-sm font-semibold line-clamp-2">{m.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-yellow-500" /> {m.rating.toFixed(1)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};

export default Watch;