import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Movie } from '@/types/movie';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onOpenChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const searchMovies = async () => {
      setLoading(true);
      try {
        const moviesRef = collection(db, 'movies');
        const q = query(
          moviesRef,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const movies: Movie[] = [];
        querySnapshot.forEach((doc) => {
          movies.push({ id: doc.id, ...doc.data() } as Movie);
        });
        
        setResults(movies);
      } catch (error) {
        console.error('Error searching movies:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMovies, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectMovie = (movie: Movie) => {
    navigate(`/watch/${movie.slug}`);
    onOpenChange(false);
    setSearchTerm('');
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="relative">
          <div className="flex items-center border-b border-border px-4 py-3">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <Input
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 text-lg"
              autoFocus
            />
            <button
              onClick={() => onOpenChange(false)}
              className="ml-2 p-1 hover:bg-muted rounded"
            >
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading && (
              <div className="p-4">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-16 h-12 bg-muted rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="p-2">
                {results.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <img
                      src={movie.thumbnailUrl}
                      alt={movie.name}
                      className="w-16 h-12 object-cover rounded"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="font-medium">{movie.name}</h3>
                      <p className="text-sm text-muted-foreground">{movie.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && searchTerm && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No movies found for "{searchTerm}"
              </div>
            )}

            {!searchTerm && (
              <div className="p-8 text-center text-muted-foreground">
                Start typing to search for movies...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};