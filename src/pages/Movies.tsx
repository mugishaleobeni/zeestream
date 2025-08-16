import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Filter, X, Play, Download } from 'lucide-react'; // Import Play and Download icons
import { collection, query, orderBy, limit, startAfter, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Movie } from '@/types/movie'; // Assuming this correctly points to your updated Movie interface
import { MovieGrid } from '@/components/movie/MovieGrid';
import { AuthModal } from '@/components/modals/AuthModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast'; // Import toast for notifications

const MOVIES_PER_PAGE = 24;

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]); // State for dynamic categories

  const typeFilter = searchParams.get('type') || 'all';
  const categoryFilter = searchParams.get('category') || 'all';

  // Types are still static as they are fixed enum values
  const types = ['all', 'original', 'translated'];

  const mapMovieDoc = useCallback((doc: any): Movie => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      slug: data.slug || '',
      thumbnailUrl: data.thumbnailUrl || 'https://placehold.co/200x300/E0E0E0/333333?text=No+Image',
      type: data.type || 'original',
      category: data.category || 'Uncategorized',
      // Ensure likes is an array of strings (user UIDs) for correct count calculation
      likes: Array.isArray(data.likes) ? data.likes : [],
      comments: data.comments?.map((comment: any) => ({
        id: comment.id || '',
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

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const fetchCategories = async () => {
    try {
      const moviesRef = collection(db, 'movies');
      const q = query(moviesRef, orderBy('category')); // Order by category to help with unique extraction
      const snapshot = await getDocs(q);
      const allMovies = snapshot.docs.map(mapMovieDoc);
      const categories = Array.from(new Set(allMovies.map(movie => movie.category)))
        .filter(category => category && category.trim() !== '')
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
      setDynamicCategories(['all', ...categories]); // Add 'all' option
    } catch (error) {
      console.error('Error fetching dynamic categories:', error);
    }
  };

  const loadMovies = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setMovies([]);
        setLastDoc(null);
        setHasMore(true);
      }

      const moviesRef = collection(db, 'movies');
      let q = query(moviesRef, orderBy('uploadDate', 'desc'), limit(MOVIES_PER_PAGE));

      if (typeFilter !== 'all') {
        q = query(q, where('type', '==', typeFilter));
      }
      if (categoryFilter !== 'all') {
        q = query(q, where('category', '==', categoryFilter));
      }

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const newMovies: Movie[] = querySnapshot.docs.map(mapMovieDoc);

      if (isLoadMore) {
        setMovies(prev => [...prev, ...newMovies]);
      } else {
        setMovies(newMovies);
      }

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(newMovies.length === MOVIES_PER_PAGE);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  useEffect(() => {
    fetchCategories(); // Fetch categories once on component mount
  }, []);

  useEffect(() => {
    loadMovies(); // Reload movies whenever filters change
  }, [typeFilter, categoryFilter, mapMovieDoc]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadMovies(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>Movies - Zeestream</title>
        <meta name="description" content="Browse our collection of movies on Zeestream" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Movies</h1>
            <p className="text-muted-foreground">
              Discover amazing movies {typeFilter !== 'all' && `in ${typeFilter}`} 
              {categoryFilter !== 'all' && ` ${categoryFilter}`} category
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className={`mb-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={(value) => updateFilter('type', value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(typeFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchParams({});
                }}
                className="md:mt-7"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* MovieGrid now receives onDownloadClick prop */}
        <MovieGrid
          movies={movies}
          loading={loading}
          onAuthRequired={() => setShowAuthModal(true)}
          onDownloadClick={handleDirectDownload} // Pass the direct download handler
        />

        {hasMore && !loading && (
          <div className="text-center mt-12">
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outline"
              size="lg"
            >
              {loadingMore ? 'Loading...' : 'Load More Movies'}
            </Button>
          </div>
        )}

        {!loading && movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No movies found with current filters.</p>
            <Button
              variant="outline"
              onClick={() => setSearchParams({})}
              className="mt-4"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};

export default Movies;
