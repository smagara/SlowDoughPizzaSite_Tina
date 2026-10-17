import React from 'react';
import { ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#24211e] text-[#f4efe8] py-14 border-t border-[#3b342d]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#3b342d]">
          <div>
            <span className="font-serif text-3xl font-bold text-[#faf8f5] block">
              Slow Dough Pizza Co.
            </span>
            <p className="mt-1 text-xs text-[#a39688] tracking-widest uppercase font-mono">
              72-Hour Cold Cellar Aged • 900° Wood Hearth
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-[#b8ab9e]">
            <a href="#philosophy" className="hover:text-[#faf8f5] transition-colors">
              The Differentiator
            </a>
            <a href="#art" className="hover:text-[#faf8f5] transition-colors">
              Minimal Art &amp; Craft
            </a>
            <a href="#menu" className="hover:text-[#faf8f5] transition-colors">
              Menu
            </a>
            <a href="#journal" className="hover:text-[#faf8f5] transition-colors">
              Blog Essays
            </a>
            <a href="#hours" className="hover:text-[#faf8f5] transition-colors">
              Hours &amp; Location
            </a>
          </div>

          <button
            onClick={scrollToTop}
            id="footer-back-to-top-btn"
            className="p-3 rounded-full bg-[#352f2a] hover:bg-[#473f38] text-[#e8dfd3] transition-colors cursor-pointer"
            aria-label="Scroll back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8c8072]">
          <p>
            418 Mill Street • Historic River District • (555) 234-7890
          </p>
          <p>
            © {new Date().getFullYear()} Slow Dough Pizza Co. All dough aged with patience.
          </p>
        </div>
      </div>
    </footer>
  );
};
