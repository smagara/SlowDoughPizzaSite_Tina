import React from 'react';
import { STORE_HOURS } from '../data/pizzaShopData';
import { Clock, MapPin, Phone, Mail, Sparkles, AlertCircle } from 'lucide-react';

export const HoursAndLocation: React.FC = () => {
  return (
    <section id="hours" className="py-16 sm:py-24 border-b border-[#e6ddd2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#c85a32]">
            Visit the Pizzeria
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#24211e]">
            Store Hours & Location
          </h2>
          <p className="mt-3 text-base text-[#615448]">
            We operate on a fermentation-first schedule. Mondays and Tuesdays are dedicated to 
            mixing, balling, and resting dough in the cold cellar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Hours Table Column */}
          <div className="lg:col-span-7 bg-[#faf7f2] p-6 sm:p-8 rounded-2xl border border-[#e2d6c7] shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded2c3]">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#c85a32]" />
                <h3 className="font-serif text-xl font-bold text-[#24211e]">
                  Weekly Schedule
                </h3>
              </div>
              <span className="text-xs font-mono bg-[#eee3d4] text-[#6e6052] px-2.5 py-1 rounded">
                Dough Cycle
              </span>
            </div>

            <div className="divide-y divide-[#ece2d6]">
              {STORE_HOURS.map((schedule) => (
                <div
                  key={schedule.day}
                  className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 ${
                    schedule.isClosed ? 'opacity-80' : ''
                  }`}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif font-bold text-base text-[#24211e] w-24">
                      {schedule.day}
                    </span>
                    {schedule.statusNote && (
                      <span className="text-xs text-[#7d6e60] italic hidden md:inline">
                        ({schedule.statusNote})
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        schedule.isClosed
                          ? 'text-[#9c5332] font-mono text-xs uppercase'
                          : 'text-[#24211e] font-semibold'
                      }`}
                    >
                      {schedule.hours}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Batch Notice */}
            <div className="p-4 rounded-xl bg-[#f2e9dc] border border-[#ded1bf] flex items-start gap-3 text-xs text-[#5e5144]">
              <AlertCircle className="w-4 h-4 text-[#c85a32] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#24211e]">Batch Capacity:</strong> We produce a fixed quantity of 110 dough balls each day to guarantee exact 72-hour aging. On Friday and Saturday evenings, we occasionally sell out before closing time.
              </div>
            </div>
          </div>

          {/* Location & Details Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Address & Contact Card */}
            <div className="bg-[#faf7f2] p-6 sm:p-8 rounded-2xl border border-[#e2d6c7] shadow-xs space-y-5">
              <h3 className="font-serif text-xl font-bold text-[#24211e] pb-3 border-b border-[#ded2c3]">
                Pizzeria Location
              </h3>

              <div className="space-y-4 text-sm text-[#4d4237]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#c85a32] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#24211e] font-semibold">Slow Dough Pizza Co.</strong>
                    <span>418 Mill Street, Historic River District</span>
                    <span className="block text-xs text-[#7a6b5e] mt-0.5">Corner of Mill &amp; Tanner Lane</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#c85a32] shrink-0" />
                  <span>(555) 234-7890</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#c85a32] shrink-0" />
                  <span>hello@slowdoughpizza.com</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ded2c3] space-y-2 text-xs text-[#6e6052]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c85a32]" />
                  <span>Free street parking along Mill Street after 5:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c85a32]" />
                  <span>Indoor seating for 34 guests &amp; heated seasonal patio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c85a32]" />
                  <span>Counter service for walk-in takeaway pies</span>
                </div>
              </div>
            </div>

            {/* Simple Graphic Representation of Location */}
            <div className="bg-[#f0e7db] p-6 rounded-2xl border border-[#ded2c1] text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#faf7f2] border border-[#d6c7b4] flex items-center justify-center mx-auto text-[#c85a32]">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-[#24211e]">In the Historic River District</h4>
              <p className="text-xs text-[#6e6052] max-w-xs mx-auto">
                Located inside the restored 1904 flour warehouse opposite the old river footbridge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
