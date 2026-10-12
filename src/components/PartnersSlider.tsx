import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logo_url?: string;
}

interface PartnersSliderProps {
  partners: Partner[];
  autoplayDelay?: number;
}

export default function PartnersSlider({ partners, autoplayDelay = 4000 }: PartnersSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate how many items to show based on screen size
  const itemsPerPage = 3;
  const totalPages = Math.ceil(partners.length / itemsPerPage);

  // Get current page items
  const startIndex = currentIndex * itemsPerPage;
  const currentItems = partners.slice(startIndex, startIndex + itemsPerPage);

  // Auto-advance
  useEffect(() => {
    if (isPaused || partners.length <= itemsPerPage) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [isPaused, partners.length, itemsPerPage, totalPages, autoplayDelay]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page: number) => {
    setCurrentIndex(page);
  };

  // If there are 3 or fewer partners, show them all without slider
  if (partners.length <= itemsPerPage) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        {partners.map((p) => (
          <div key={p.id} className="flex items-center gap-3 opacity-90 transition hover:opacity-100">
            {p.logo_url && (
              <img src={p.logo_url} alt={p.name} className="h-10 w-auto max-w-[130px] object-contain" />
            )}
            <span className="text-sm font-semibold text-ink">{p.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Content */}
      <div className="overflow-hidden px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="flex items-center justify-center gap-8 sm:gap-12"
          >
            {currentItems.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 opacity-90 transition hover:opacity-100"
              >
                {p.logo_url && (
                  <img src={p.logo_url} alt={p.name} className="h-10 w-auto max-w-[130px] object-contain" />
                )}
                <span className="text-sm font-semibold text-ink">{p.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-surface p-2 shadow-md transition hover:bg-surface-raised hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
        aria-label="Previous partners"
      >
        <ChevronLeft className="h-5 w-5 text-ink" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-surface p-2 shadow-md transition hover:bg-surface-raised hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
        aria-label="Next partners"
      >
        <ChevronRight className="h-5 w-5 text-ink" />
      </button>

      {/* Dots Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToPage(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-8 bg-brand-600' : 'w-2 bg-line hover:bg-brand-400'
            }`}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
