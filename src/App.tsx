import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CraftSection } from './components/CraftSection';
import { MenuSection } from './components/MenuSection';
import { ArticlesSection } from './components/ArticlesSection';
import { HoursAndLocation } from './components/HoursAndLocation';
import { Footer } from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('philosophy');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Scroll listener to update active nav tab
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['philosophy', 'art', 'menu', 'journal', 'hours'];
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#24211e] flex flex-col selection:bg-[#c85a32] selection:text-white" id="top">
      {/* Header with status badge & navigation */}
      <Navbar activeSection={activeSection} onNavigate={scrollToSection} />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* The Differentiator / Hero */}
        <Hero
          onExploreMenu={() => scrollToSection('menu')}
          onReadEssay={() => scrollToSection('journal')}
        />

        {/* Minimal Art & Craft of Dough Handling and Oven */}
        <CraftSection />

        {/* The Menu */}
        <MenuSection />

        {/* The Two Blog Posts: Dough Aging & Flour Selection */}
        <ArticlesSection />

        {/* Store Hours & Location */}
        <HoursAndLocation />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
