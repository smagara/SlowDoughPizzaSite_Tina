import React, { useState } from 'react';
import { MENU_CATEGORIES } from '../data/pizzaShopData';
import { Leaf, Info } from 'lucide-react';

export const MenuSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCategories = selectedCategory === 'all'
    ? MENU_CATEGORIES
    : MENU_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  return (
    <section id="menu" className="py-16 sm:py-24 border-b border-[#e6ddd2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#c85a32]">
            Seasonal Artisanal Selections
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#24211e]">
            Our Daily Menu
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#615448]">
            Every pizza is an authentic 12-inch Neapolitan pie crafted from 72-hour slow-fermented dough, 
            stretched gently by hand to preserve the airy cornicione, and flash-baked in our 900°F wood-fired hearth.
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <button
            id="menu-filter-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#24211e] text-[#faf8f5] shadow-xs'
                : 'bg-[#f0e8dc] text-[#54483d] hover:bg-[#e4d8cb]'
            }`}
          >
            Full Menu
          </button>
          {MENU_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`menu-filter-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#24211e] text-[#faf8f5] shadow-xs'
                  : 'bg-[#f0e8dc] text-[#54483d] hover:bg-[#e4d8cb]'
              }`}
            >
              {cat.title.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Menu Listings */}
        <div className="space-y-16">
          {filteredCategories.map((category) => (
            <div key={category.id} className="space-y-6">
              {/* Category Header */}
              <div className="border-b border-[#ded3c5] pb-3">
                <h3 className="font-serif text-2xl font-bold text-[#24211e]">
                  {category.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#736659] mt-1">
                  {category.subtitle}
                </p>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    id={`menu-item-${item.id}`}
                    className="bg-[#faf7f2] p-5 sm:p-6 rounded-xl border border-[#e5dcce] hover:border-[#cfbeaa] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Title & Price Line */}
                      <div className="flex items-baseline justify-between gap-4">
                        <div>
                          <h4 className="font-serif text-lg font-bold text-[#24211e]">
                            {item.name}
                          </h4>
                          {item.italianName && (
                            <span className="block text-xs font-serif italic text-[#8a7a6c] mt-0.5">
                              {item.italianName}
                            </span>
                          )}
                        </div>
                        <span className="font-serif font-bold text-lg text-[#24211e] shrink-0">
                          ${item.price}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mt-2.5 text-sm text-[#5c5247] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Tags / Dietary Badges */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#eee5d8] flex flex-wrap items-center gap-1.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                              tag === 'Vegetarian' || tag === 'Vegan'
                                ? 'bg-[#e4ede1] text-[#335928]'
                                : tag === 'House Favorite'
                                ? 'bg-[#f7e6df] text-[#8c3d1e]'
                                : 'bg-[#eee7dd] text-[#63574c]'
                            }`}
                          >
                            {(tag === 'Vegetarian' || tag === 'Vegan') && (
                              <Leaf className="w-3 h-3 text-[#335928]" />
                            )}
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Note on Ordering / Dining In */}
        <div className="mt-14 p-5 rounded-xl bg-[#f2ebdF] border border-[#ded3c5] flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[#5c5044]">
          <Info className="w-5 h-5 text-[#c85a32] shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="text-[#24211e]">Dine-In & Walk-In Only:</strong> To preserve the airy crust texture directly from the 900° wood hearth, we do not provide third-party delivery or online ordering. Walk-ins are always welcomed on a first-come, first-served basis. Takeaway is available in person at the counter.
          </div>
        </div>
      </div>
    </section>
  );
};
