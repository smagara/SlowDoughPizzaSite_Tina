import React from 'react';
import { DoughHandlingArt, WoodOvenArt } from './MinimalArt';
import { Sparkles, Flame } from 'lucide-react';

export const CraftSection: React.FC = () => {
  return (
    <section id="art" className="py-16 sm:py-20 bg-[#f5ede2]/40 border-b border-[#e6ddd2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eee5d8] text-xs font-semibold text-[#736353] tracking-widest uppercase">
            <span>Minimal Art & Process</span>
          </div>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-[#24211e]">
            Handled with Care, Baked in Fire
          </h2>
          <p className="mt-3 text-base text-[#615448]">
            Two sacred pillars define our craft: the patient 72hrs cold cellar ferment, 
            and a 90-second flash bake upon refractory stone at 900 degrees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 max-w-5xl mx-auto items-start">
          {/* Item 1: Dough Resting & Aging */}
          <div className="bg-[#faf7f2] p-6 sm:p-8 rounded-2xl border border-[#e2d6c7] shadow-xs space-y-6">
            <DoughHandlingArt
              caption="Wooden proofing boxes stacked in our cold cellar. We patiently wait for 72hrs for the best flavor dough."
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#e8ded3] pb-2">
                <span className="font-serif font-bold text-lg text-[#24211e]">01. The 72hr Cellar Rest</span>
                <span className="text-xs font-mono text-[#8a4224] bg-[#f5e6dd] px-2 py-0.5 rounded">Aging: 72hrs</span>
              </div>
              <p className="text-sm text-[#544a40] leading-relaxed">
                We patiently wait for 72hrs for the dough to achieve peak flavor and optimal digestibility. 
                Stacked in traditional wooden proofing boxes (<em>cassette di lievitazione</em>) in our cold cellar, 
                the living dough rests undisturbed. Over three days, natural enzymes gently convert complex starches 
                into sweet, toasted maltose and break down tough gluten bonds, guaranteeing a light, airy crumb that sits easily on your stomach.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-[#6e6357]">
                <span className="bg-[#ede4d7] px-2.5 py-1 rounded">Stacked proofing trays</span>
                <span className="bg-[#ede4d7] px-2.5 py-1 rounded">Cold cellar at 4°C</span>
                <span className="bg-[#ede4d7] px-2.5 py-1 rounded">Full enzymatic maturity</span>
              </div>
            </div>
          </div>

          {/* Item 2: Wood Oven */}
          <div className="bg-[#faf7f2] p-6 sm:p-8 rounded-2xl border border-[#e2d6c7] shadow-xs space-y-6">
            <WoodOvenArt
              caption="Refractory Biscotto di Sorrento stone floor maintains 900°F without scorching, flash-baking in ninety seconds."
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#e8ded3] pb-2">
                <span className="font-serif font-bold text-lg text-[#24211e]">02. The 900° Wood Hearth</span>
                <span className="text-xs font-mono text-[#8a4224] bg-[#f5e6dd] px-2 py-0.5 rounded">Duration: 90 Sec</span>
              </div>
              <p className="text-sm text-[#544a40] leading-relaxed">
                Fueled exclusively by dry local white oak and seasoned fruitwood, our hand-built masonry dome creates 
                a continuous rolling flame across the low ceiling. In ninety seconds, extreme radiant heat vaporizes water 
                within the dough, instantly inflating the crust before the delicate fior di latte cheese can release excess moisture.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-[#6e6357]">
                <span className="bg-[#ede4d7] px-2.5 py-1 rounded">Seasoned White Oak</span>
                <span className="bg-[#ede4d7] px-2.5 py-1 rounded">Leopard micro-char</span>
                <span className="bg-[#ede4d7] px-2.5 py-1 rounded">90-second bake</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
