import React from 'react';
import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard'; // Assuming MovieCard is in the same directory

interface MovieGridProps {
  movies: Movie[];
  onAuthRequired: () => void;
  loading?: boolean;
  onDownloadClick: (url: string | undefined, name: string) => void;
}

export const MovieGrid: React.FC<MovieGridProps> = ({ movies, onAuthRequired, loading, onDownloadClick }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(24)].map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-[2/3] w-full loading-shimmer rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 loading-shimmer rounded w-3/4" />
              <div className="h-3 loading-shimmer rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No movies found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onAuthRequired={onAuthRequired}
          onDownloadClick={onDownloadClick}
        />
      ))}
    </div>
  );
};
