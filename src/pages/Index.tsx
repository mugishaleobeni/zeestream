import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Movie } from '@/types/movie'; // Corrected: Changed '=>' to 'from'
import { HeroSlider } from '@/components/movie/HeroSlider';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { AuthModal } from '@/components/modals/AuthModal';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

// Define a common limit for displaying grouped sections
const SECTION_DISPLAY_LIMIT = 12;

const Index = () => {
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topSeries, setTopSeries] = useState<Movie[]>([]);
  const [categorizedMovies, setCategorizedMovies] = useState<Record<string, Movie[]>>({});
  const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Reusable handler for direct download
  const handleDirectDownload = useCallback((url: string | undefined, name: string) => {
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
      link.setAttribute('download', `${name}.mp4`);
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
  }, []);

  // mapMovieDoc is a useCallback at the top level of the component
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

  // Helper function to group movies by relationship and limit the result
  const groupAndLimitByRelationship = useCallback((movies: Movie[], limitCount: number = SECTION_DISPLAY_LIMIT): Movie[] => {
    const groupedMovies: Record<string, Movie[]> = {};
    for (const movie of movies) {
      const rel = movie.relationship && movie.relationship.trim() !== '' ? movie.relationship : movie.id;
      if (!groupedMovies[rel]) {
        groupedMovies[rel] = [];
      }
      groupedMovies[rel].push(movie);
    }

    const representativeMovies: Movie[] = [];
    for (const relKey in groupedMovies) {
      if (groupedMovies[relKey].length > 0) {
        representativeMovies.push(groupedMovies[relKey][0]);
      }
    }

    representativeMovies.sort((a, b) => a.name.localeCompare(b.name));

    return representativeMovies.slice(0, limitCount);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const moviesRef = collection(db, 'movies');

        const allMoviesSnapshot = await getDocs(moviesRef);
        const allMoviesData = allMoviesSnapshot.docs.map(mapMovieDoc);
        console.log("All Movies Data (for dynamic categories):", allMoviesData);

        const dynamicCategories = Array.from(new Set(allMoviesData.map(movie => movie.category)))
          .filter(category => category && category.trim() !== '');
        console.log("Dynamic Categories Found:", dynamicCategories);

        const heroQuery = query(moviesRef, orderBy('uploadDate', 'desc'), limit(10));
        const heroSnapshot = await getDocs(heroQuery);
        const heroMoviesData: Movie[] = heroSnapshot.docs.map(mapMovieDoc);
        setHeroMovies(heroMoviesData);
        console.log("Hero Movies:", heroMoviesData);

        const popularQuery = query(moviesRef, where('rating', '>=', 5), orderBy('rating', 'desc'), limit(SECTION_DISPLAY_LIMIT * 2));
        const popularSnapshot = await getDocs(popularQuery);
        const popularCandidates: Movie[] = popularSnapshot.docs.map(mapMovieDoc);
        const groupedPopularMovies = groupAndLimitByRelationship(popularCandidates, SECTION_DISPLAY_LIMIT);
        setPopularMovies(groupedPopularMovies);
        console.log("Popular Movies (rating >= 5, grouped):", groupedPopularMovies);

        const topSeriesQuery = query(
          moviesRef,
          where('isSeries', '==', true),
          where('rating', '>=', 8),
          orderBy('rating', 'desc'),
          orderBy('relationship', 'asc')
        );
        const topSeriesSnapshot = await getDocs(topSeriesQuery);
        const topSeriesCandidates: Movie[] = topSeriesSnapshot.docs.map(mapMovieDoc);
        const groupedTopSeries = groupAndLimitByRelationship(topSeriesCandidates, SECTION_DISPLAY_LIMIT);
        setTopSeries(groupedTopSeries);
        console.log("Top Series (isSeries=true, rating>=8, grouped):", groupedTopSeries);

        const categorizedData: Record<string, Movie[]> = {};
        for (const category of dynamicCategories) {
          console.log(`Processing category: "${category}"`);
          const categoryQuery = query(
            moviesRef,
            where('category', '==', category),
            orderBy('relationship', 'asc'),
            orderBy('uploadDate', 'desc')
          );
          const categorySnapshot = await getDocs(categoryQuery);
          const allMoviesInCategory: Movie[] = categorySnapshot.docs.map(mapMovieDoc);
          console.log(`  All movies in "${category}":`, allMoviesInCategory.map(m => ({ id: m.id, name: m.name, relationship: m.relationship })));
          
          const representativeMovies = groupAndLimitByRelationship(allMoviesInCategory, SECTION_DISPLAY_LIMIT);
          console.log(`  Representative movies for "${category}":`, representativeMovies.map(m => m.name));
          
          if (representativeMovies.length > 0) {
            categorizedData[category] = representativeMovies;
            console.log(`  Category "${category}" added to categorizedData.`);
          } else {
            console.log(`  Category "${category}" has no representative movies and will not be displayed.`);
          }
        }
        setCategorizedMovies(categorizedData);
        console.log("Categorized Movies (Dynamic, Grouped by Relationship):", categorizedData);

        const comingSoonQuery = query(
          moviesRef,
          where('comingSoon', '==', true),
          orderBy('releaseDate', 'asc'),
          limit(SECTION_DISPLAY_LIMIT)
        );
        const comingSoonSnapshot = await getDocs(comingSoonQuery);
        const comingSoonData: Movie[] = comingSoonSnapshot.docs.map(mapMovieDoc);
        setComingSoonMovies(comingSoonData);
        console.log("Coming Soon Movies:", comingSoonData);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [handleDirectDownload, mapMovieDoc, groupAndLimitByRelationship]);

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-[70vh] loading-shimmer rounded-xl" />
        
        {[...Array(4)].map((_, i) => (
          <div key={i} className="container mx-auto px-4">
            <div className="h-8 w-48 loading-shimmer rounded mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, j) => (
                <div key={j} className="aspect-[2/3] loading-shimmer rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Zeestream - Your Ultimate Movie Streaming Destination</title>
        <meta 
          name="description" 
          content="Stream the latest movies and TV series on Zeestream. Discover trending content, upcoming releases, and classics all in one place." 
        />
        {/* Open Graph Tags for Social Media */}
        <meta property="og:title" content="Zeestream - Your Ultimate Movie Streaming Destination" />
        <meta property="og:description" content="Stream the latest movies and TV series on Zeestream. Discover trending content, upcoming releases, and classics all in one place." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content="https://placehold.co/1200x630/E0E0E0/333333?text=Zeestream+zeeStream" /> {/* Replace with your actual site logo URL */}
        <meta property="og:site_name" content="Zeestream" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content="Zeestream - Your Ultimate Movie Streaming Destination" />
        <meta name="twitter:description" content="Stream the latest movies and TV series on Zeestream. Discover trending content, upcoming releases, and classics all in one place." />
        <meta name="twitter:image" content="https://placehold.co/1200x675/E0E0E0/333333?text=Zeestream+Logo" /> {/* Replace with your actual site logo URL */}

        {/* Canonical Link */}
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="space-y-12">
        {heroMovies.length > 0 && (
          <div className="container mx-auto px-4">
            <HeroSlider movies={heroMovies} />
          </div>
        )}

        {popularMovies.length > 0 && (
          <section className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Popular Movies</h2>
              <Link to="/movies?sort=popular">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            <MovieGrid
              movies={popularMovies}
              onAuthRequired={() => setShowAuthModal(true)}
              onDownloadClick={handleDirectDownload}
            />
          </section>
        )}

        {topSeries.length > 0 && (
          <section className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Top Series</h2>
              <Link to="/movies?is_series=true&sort=rating">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            <MovieGrid
              movies={topSeries}
              onAuthRequired={() => setShowAuthModal(true)}
              onDownloadClick={handleDirectDownload}
            />
          </section>
        )}

        {Object.entries(categorizedMovies).map(([category, movies]) => (
          <section key={category} className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold capitalize">{category} Movies</h2>
              <Link to={`/movies?category=${category}`}>
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            <MovieGrid
              movies={movies}
              onAuthRequired={() => setShowAuthModal(true)}
              onDownloadClick={handleDirectDownload}
            />
          </section>
        ))}

        {comingSoonMovies.length > 0 && (
          <section className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <Link to="/movies?coming_soon=true">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            <MovieGrid
              movies={comingSoonMovies}
              onAuthRequired={() => setShowAuthModal(true)}
              onDownloadClick={handleDirectDownload}
            />
          </section>
        )}

        {heroMovies.length === 0 && popularMovies.length === 0 && topSeries.length === 0 && Object.keys(categorizedMovies).length === 0 && comingSoonMovies.length === 0 && (
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Zeestream</h2>
            <p className="text-muted-foreground mb-8">
              No movies available yet. Check back soon for amazing content!
            </p>
            <Link to="/about">
              <Button>Learn More</Button>
            </Link>
          </div>
        )}
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};

export default Index;
