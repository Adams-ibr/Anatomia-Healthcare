import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useCallback } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "3D Atlas", href: "/services" },
  { label: "Articles", href: "/blog" },
  { label: "Quizzes", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const navItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  }, [searchQuery, setLocation]);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground" data-testid="text-logo">Anatomia</span>
            </Link>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={prefersReducedMotion ? false : "hidden"}
                animate="visible"
                variants={navItemVariants}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-sm font-medium ${
                      location === link.href 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    }`}
                    data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </nav>

          <motion.div 
            className="flex items-center gap-2"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className={`hidden sm:flex items-center ${searchOpen ? 'w-64' : 'w-48'} transition-all duration-200`}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="pl-9 pr-4 h-9 bg-muted/50 border-transparent focus:border-primary"
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 100)}
                  data-testid="input-search"
                />
              </div>
            </div>

            <Button size="icon" variant="ghost" className="sm:hidden" data-testid="button-search-mobile">
              <Search className="w-5 h-5" />
            </Button>

            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2">
              <Link href="/register">
                <Button size="sm" data-testid="button-signup">Sign Up</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" data-testid="button-login">Log In</Button>
              </Link>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </motion.div>
        </div>

        {prefersReducedMotion ? (
          mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === link.href 
                          ? "text-primary bg-primary/5" 
                          : "text-muted-foreground"
                      }`}
                      data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Link href="/register" className="flex-1">
                    <Button className="w-full" size="sm" data-testid="button-signup-mobile">Sign Up</Button>
                  </Link>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full" size="sm" data-testid="button-login-mobile">Log In</Button>
                  </Link>
                </div>
              </nav>
            </div>
          )
        ) : (
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="lg:hidden py-4 border-t border-border overflow-hidden"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={mobileMenuVariants}
                transition={{ duration: 0.2 }}
              >
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <Link href={link.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${
                            location === link.href 
                              ? "text-primary bg-primary/5" 
                              : "text-muted-foreground"
                          }`}
                          data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          {link.label}
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    className="flex gap-2 mt-4 pt-4 border-t border-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                  >
                    <Link href="/register" className="flex-1">
                      <Button className="w-full" size="sm" data-testid="button-signup-mobile">Sign Up</Button>
                    </Link>
                    <Link href="/login" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm" data-testid="button-login-mobile">Log In</Button>
                    </Link>
                  </motion.div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </header>
  );
}
