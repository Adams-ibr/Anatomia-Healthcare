import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Partner } from "@shared/schema";

export function Partners() {
  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-background overflow-hidden relative">
        <div className="container mx-auto px-4 mb-10">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto" />
        </div>
      </section>
    );
  }

  const activePartners = partners || [];

  return (
    <section className="py-24 bg-background overflow-hidden relative border-y border-border/50">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Trusted by Industry Leaders
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We collaborate with top-tier healthcare institutions and educational organizations globally.
            </p>
          </motion.div>
        </div>

        {activePartners.length > 0 ? (
          <div className="relative max-w-5xl mx-auto">
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

            {/* Marquee Container */}
            <div className="flex overflow-hidden group">
              <motion.div
                className="flex items-center gap-12 sm:gap-20 pr-12 sm:pr-20"
                animate={{
                  x: ["0%", "-50%"],
                }}
                transition={{
                  repeat: Infinity,
                  ease: "linear",
                  duration: 20, // Adjust speed here
                }}
                style={{
                  // Create a seamless loop. Duplicate items within the motion div.
                  width: "max-content",
                }}
              >
                {[...activePartners, ...activePartners, ...activePartners].map((partner, index) => (
                  <a
                    key={`${partner.id}-${index}`}
                    href={partner.websiteUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 group/logo block grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-105"
                  >
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="h-12 sm:h-16 w-auto object-contain"
                    />
                  </a>
                ))}
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>Our partner network is growing. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
