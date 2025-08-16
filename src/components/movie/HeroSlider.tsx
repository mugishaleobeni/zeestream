import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Movie } from '@/types/movie';
import { Button } from '@/components/ui/button';

interface HeroSliderProps {
  movies: Movie[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    if (movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [movies.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? movies.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
  };

  if (!currentMovie) {
    return (
      <div className="relative h-[70vh] bg-muted loading-shimmer" />
    );
  }

  return (
    <div className="relative h-[70vh] overflow-hidden rounded-xl">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${currentMovie.thumbnailUrl})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <span className="px-2 py-1 bg-primary rounded text-primary-foreground font-medium">
                  Featured
                </span>
                <span className="text-white/80">{currentMovie.category}</span>
                <span className="text-white/60">•</span>
                <span className="text-white/80">★ {currentMovie.rating}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                {currentMovie.name}
              </h1>
              
              <p className="text-lg text-white/90 leading-relaxed max-w-xl">
                {currentMovie.description}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate(`/watch/${currentMovie.slug}`)}
                className="btn-stream text-lg px-8 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Play Now
              </Button>
              
              <Button
                onClick={() => navigate(`/watch/${currentMovie.slug}`)}
                variant="outline"
                className="btn-secondary text-lg px-8 py-3"
              >
                <Info className="w-5 h-5 mr-2" />
                More Info
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};