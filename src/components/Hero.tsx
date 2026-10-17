import React from 'react';
import { ArrowDown, Flame, Hourglass, Wheat, ShieldCheck } from 'lucide-react';
import { DoughHandlingArt } from './MinimalArt';

interface HeroProps {
  onExploreMenu: () => void;
  onReadEssay: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, onReadEssay }) => {
  return (
    <section id="philosophy" className="pt-12 sm:pt-16 pb-16 sm:pb-20 border-b border-[#e6ddd2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Core Message & Differentiator */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0e7dc] border border-[#ded2c3] text-xs font-semibold text-[#8a4224] tracking-wider uppercase">
              <Hourglass className="w-3.5 h-3.5 text-[#c85a32]" />
              <span>The 72-Hour Cold Cellar Ferment</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#24211e] leading-[1.12]">
              Time is our primary ingredient.
            </h1>

            <p className="text-lg sm:text-xl text-[#524940] leading-relaxed max-w-2xl font-normal">
              Most pizzerias rush their dough in four hours. At Slow Dough, we rest every batch for a full{' '}
              <strong className="text-[#24211e] font-semibold">72 to 96 hours</strong> in a cold stone cellar. 
              The natural enzymatic transformation yields an extraordinarily light, blistered crust that is completely easy on your stomach.
            </p>

            {/* Quick Process Metric Badges */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 py-3 max-w-xl">
              <div className="bg-[#f5ede3] p-3.5 rounded-lg border border-[#e2d6c7]">
                <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#24211e]">72h</span>
                <span className="text-xs font-medium text-[#73675a] uppercase tracking-wider">Cold Aging</span>
              </div>
              <div className="bg-[#f5ede3] p-3.5 rounded-lg border border-[#e2d6c7]">
                <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#24211e]">900°</span>
                <span className="text-xs font-medium text-[#73675a] uppercase tracking-wider">Hearth Bake</span>
              </div>
              <div className="bg-[#f5ede3] p-3.5 rounded-lg border border-[#e2d6c7]">
                <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#24211e]">100%</span>
                <span className="text-xs font-medium text-[#73675a] uppercase tracking-wider">Natural Flour</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                id="hero-explore-menu-btn"
                onClick={onExploreMenu}
                className="px-6 py-3 rounded-lg bg-[#24211e] text-[#faf8f5] hover:bg-[#38312b] font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>View Daily Menu</span>
                <ArrowDown className="w-4 h-4 text-[#c85a32]" />
              </button>
              <button
                id="hero-read-essay-btn"
                onClick={onReadEssay}
                className="px-6 py-3 rounded-lg bg-[#f0e7dc] text-[#3d352e] hover:bg-[#e6dcce] border border-[#ded3c5] font-medium text-sm transition-all cursor-pointer"
              >
                Why 72 Hours Matters
              </button>
            </div>
          </div>

          {/* Right Column: Minimal Art Display */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <DoughHandlingArt
              className="w-full"
              caption="Fig. 01 — Proofing boxes of living dough resting patiently beside the cellar clock. We patiently wait for 72hrs for the best flavor dough."
            />
          </div>
        </div>

        {/* Process Differentiator Comparison Matrix (Simple, Clean, Educational) */}
        <div className="mt-16 pt-12 border-t border-[#e8ded3]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24211e]">
              Why Most Pizza Leaves You Feeling Heavy
            </h2>
            <p className="mt-2 text-sm text-[#665a4e]">
              A side-by-side look at conventional rushed baking versus our patient 3-day fermentation method.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Standard Pizza Box */}
            <div className="bg-[#f2ece3]/60 p-6 rounded-xl border border-[#ded3c5] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-[#786b5f]">Industry Standard</span>
                <span className="text-xs px-2.5 py-1 rounded bg-[#e8ded2] text-[#63574c] font-medium">2 to 6 Hours</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#38312a]">Quick Commercial Ferment</h3>
              <ul className="space-y-2.5 text-sm text-[#5c5247]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a84d2a] font-bold mt-0.5">✕</span>
                  <span>Heavy dose of commercial yeast forces rapid swelling before starches can break down.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a84d2a] font-bold mt-0.5">✕</span>
                  <span>Complex gluten proteins remain tough and unyielding, causing post-meal bloating and lethargy.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a84d2a] font-bold mt-0.5">✕</span>
                  <span>Flat, one-note yeasty flavor without subtle toasted wheat or sourdough complexity.</span>
                </li>
              </ul>
            </div>

            {/* Slow Dough Box */}
            <div className="bg-[#faf6ee] p-6 rounded-xl border-2 border-[#c85a32]/30 shadow-xs space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-[#c85a32] font-semibold">Our Method</span>
                <span className="text-xs px-2.5 py-1 rounded bg-[#f5e4dc] text-[#8c3d1e] font-semibold">72 to 96 Hours</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#24211e]">Slow Cellar Aging</h3>
              <ul className="space-y-2.5 text-sm text-[#453c33]">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#c85a32] shrink-0 mt-0.5" />
                  <span>Enzymes naturally predigest complex starches into sweet maltose and glucose.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#c85a32] shrink-0 mt-0.5" />
                  <span>Gluten bonds gently soften, resulting in a cloud-like crust that digests with ease.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#c85a32] shrink-0 mt-0.5" />
                  <span>Deep notes of hazelnut, sourdough culture, and natural caramelized sugars.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
