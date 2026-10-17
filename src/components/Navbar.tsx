import React, { useState } from 'react';
import { Menu, X, Clock, MapPin, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'philosophy', label: 'The Differentiator' },
    { id: 'art', label: 'The Craft' },
    { id: 'menu', label: 'Menu' },
    { id: 'journal', label: 'Blog & Essays' },
    { id: 'hours', label: 'Hours & Location' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#e6ddd2] transition-colors">
      {/* Top micro banner */}
      <div className="bg-[#24211e] text-[#e8ded3] text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#c85a32] animate-pulse inline-block" />
        <span>Today's Dough: 72-Hour Cold Cellar Ferment</span>
        <span className="text-[#8c8278] hidden sm:inline">•</span>
        <span className="text-[#b5aaa0] hidden sm:inline">Doors open at 4:30 PM (Wed–Sun)</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex flex-col focus:outline-none"
            id="brand-logo-btn"
          >
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#24211e] group-hover:text-[#c85a32] transition-colors">
              Slow Dough
            </span>
            <span className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-[#7d7165]">
              Artisan Pizza Co. • 72H Aged
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'text-[#c85a32] bg-[#f0e7dc] font-semibold'
                      : 'text-[#504840] hover:text-[#24211e] hover:bg-[#f2ece3]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Quick Badge */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => handleNavClick('hours')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f0e8dc] text-[#5c5045] hover:bg-[#e8dec0] border border-[#ded3c5] transition-colors"
              id="header-hours-badge"
            >
              <Clock className="w-3.5 h-3.5 text-[#c85a32]" />
              <span>Wed–Sun • 4:30 PM</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#3e3832] hover:bg-[#f0e8dc] focus:outline-none focus:ring-2 focus:ring-[#c85a32]"
              aria-label="Toggle main menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e8ded3] bg-[#faf8f5] px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-[#38312a] hover:bg-[#f0e8dc] hover:text-[#c85a32] transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#e8ded3] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-[#6e6357] px-4 py-1">
              <MapPin className="w-4 h-4 text-[#c85a32]" />
              <span>418 Mill Street • River District</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6e6357] px-4 py-1">
              <Clock className="w-4 h-4 text-[#c85a32]" />
              <span>Wed–Sun from 4:30 PM • Walk-ins Welcome</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
