import React from 'react';

interface ArtProps {
  className?: string;
  caption?: string;
}

export const DoughHandlingArt: React.FC<ArtProps> = ({ className = '', caption }) => {
  return (
    <figure className={`flex flex-col items-center ${className}`}>
      <div className="w-full aspect-[4/3] max-w-md bg-[#f4eee6]/80 rounded-xl p-6 border border-[#e2d8cc] flex items-center justify-center relative overflow-hidden group">
        {/* Subtle background grain grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8d7864_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <svg
          viewBox="0 0 360 260"
          className="w-full h-full max-h-56 text-[#24211e]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Artisanal clock and stacked proofing boxes of resting pizza dough aging for 72 hours"
        >
          {/* Work surface table */}
          <line x1="20" y1="222" x2="340" y2="222" stroke="#7a7065" strokeWidth="1.5" />
          <line x1="32" y1="232" x2="328" y2="232" stroke="#b5a99c" strokeWidth="1" strokeDasharray="4 4" />

          {/* ========================================================= */}
          {/* STACK OF ITALIAN DOUGH PROOFING BOXES (CASSETTE DI LEGNO) */}
          {/* ========================================================= */}
          
          {/* Tray 1 (Bottom Box: 24h) */}
          <g id="dough-box-bottom">
            <rect x="36" y="186" width="168" height="34" rx="3" stroke="#4a4239" strokeWidth="1.4" fill="#faf6f0" />
            {/* Box rim & wood slat lines */}
            <line x1="36" y1="192" x2="204" y2="192" stroke="#ded4c7" strokeWidth="1" />
            <line x1="36" y1="214" x2="204" y2="214" stroke="#d5c7b7" strokeWidth="0.8" />
            {/* Recessed side handle */}
            <rect x="44" y="198" width="16" height="7" rx="3.5" stroke="#7a6e62" strokeWidth="1" fill="#ede5d8" />
            {/* Badge label */}
            <rect x="74" y="198" width="88" height="12" rx="2" stroke="#c4b6a5" strokeWidth="0.8" fill="#f4ede2" />
            <text x="118" y="207" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#7a6e62" letterSpacing="0.8">
              STAGE 1 • 24hrs REST
            </text>
          </g>

          {/* Tray 2 (Middle Box: 48h) */}
          <g id="dough-box-middle">
            <rect x="36" y="150" width="168" height="34" rx="3" stroke="#4a4239" strokeWidth="1.4" fill="#faf6f0" />
            <line x1="36" y1="156" x2="204" y2="156" stroke="#ded4c7" strokeWidth="1" />
            <line x1="36" y1="178" x2="204" y2="178" stroke="#d5c7b7" strokeWidth="0.8" />
            {/* Recessed side handle */}
            <rect x="44" y="162" width="16" height="7" rx="3.5" stroke="#7a6e62" strokeWidth="1" fill="#ede5d8" />
            {/* Badge label */}
            <rect x="74" y="162" width="88" height="12" rx="2" stroke="#c4b6a5" strokeWidth="0.8" fill="#f4ede2" />
            <text x="118" y="171" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#7a6e62" letterSpacing="0.8">
              STAGE 2 • 48hrs CELLAR
            </text>
          </g>

          {/* Tray 3 (Top Box: 72h - Open with resting plump dough balls) */}
          <g id="dough-box-top">
            {/* Resting plump fermented dough rounds visible inside the open top tray */}
            {/* Dough round 1 */}
            <g>
              <path
                d="M 52 148 C 52 126, 84 126, 84 148 Z"
                fill="#fbf8f2"
                stroke="#4a4239"
                strokeWidth="1.4"
              />
              {/* Soft aeration blister */}
              <ellipse cx="68" cy="138" rx="4" ry="2.5" stroke="#c85a32" strokeWidth="0.8" strokeDasharray="2 1" />
            </g>

            {/* Dough round 2 (Center - slightly larger mature rise) */}
            <g>
              <path
                d="M 94 148 C 94 122, 130 122, 130 148 Z"
                fill="#fbf8f2"
                stroke="#4a4239"
                strokeWidth="1.4"
              />
              {/* Mature aeration blister */}
              <ellipse cx="112" cy="134" rx="5.5" ry="3" stroke="#c85a32" strokeWidth="0.8" strokeDasharray="2 1" />
              <circle cx="119" cy="140" r="1.5" stroke="#a69482" strokeWidth="0.7" />
            </g>

            {/* Dough round 3 */}
            <g>
              <path
                d="M 140 148 C 140 126, 172 126, 172 148 Z"
                fill="#fbf8f2"
                stroke="#4a4239"
                strokeWidth="1.4"
              />
              <ellipse cx="156" cy="138" rx="4" ry="2.5" stroke="#c85a32" strokeWidth="0.8" strokeDasharray="2 1" />
            </g>

            {/* Front and side wall of top open box */}
            <rect x="36" y="144" width="168" height="6" rx="1" stroke="#4a4239" strokeWidth="1.4" fill="#ebe3d6" />
            <line x1="36" y1="148" x2="204" y2="148" stroke="#332c25" strokeWidth="1" />
            
            {/* Box lid angled behind trays */}
            <path
              d="M 194 96 L 208 92 L 208 178 L 194 182 Z"
              stroke="#685d53"
              strokeWidth="1.2"
              fill="#ede5d8"
            />
          </g>

          {/* Top highlight indicator over mature dough */}
          <g transform="translate(76, 96)">
            <rect x="0" y="0" width="76" height="18" rx="3" stroke="#c85a32" strokeWidth="1.1" fill="#faf8f5" />
            <text x="38" y="12" textAnchor="middle" fontSize="8.5" fontFamily="sans-serif" fontWeight="700" fill="#c85a32" letterSpacing="0.8">
              72hrs MATURE
            </text>
          </g>

          {/* Scattered semolina flour specks on table & box edges */}
          <g stroke="#b8a794" strokeWidth="1.2">
            <circle cx="48" cy="218" r="0.6" />
            <circle cx="62" cy="216" r="0.7" />
            <circle cx="180" cy="218" r="0.6" />
            <circle cx="198" cy="217" r="0.7" />
            <circle cx="86" cy="142" r="0.5" />
            <circle cx="134" cy="142" r="0.5" />
            <circle cx="178" cy="142" r="0.5" />
          </g>

          {/* ========================================================= */}
          {/* THE ARTISANAL BAKER'S CLOCK (MEASURING THE 72hrs REST)    */}
          {/* ========================================================= */}
          <g id="fermentation-clock" transform="translate(272, 126)">
            {/* Clock stand foot on table */}
            <rect x="-18" y="86" width="36" height="8" rx="2" stroke="#4a4239" strokeWidth="1.3" fill="#faf6f0" />
            {/* Clock stem / riser */}
            <line x1="-3" y1="56" x2="-3" y2="86" stroke="#4a4239" strokeWidth="1.4" />
            <line x1="3" y1="56" x2="3" y2="86" stroke="#4a4239" strokeWidth="1.4" />
            {/* Top hanging loop */}
            <circle cx="0" cy="-64" r="7" stroke="#4a4239" strokeWidth="1.3" fill="none" />
            <rect x="-4" y="-58" width="8" height="4" stroke="#4a4239" strokeWidth="1.2" fill="#38322c" />

            {/* Outer clock housing */}
            <circle cx="0" cy="0" r="56" stroke="#24211e" strokeWidth="2" fill="#fdfbf7" />
            {/* Inner bezel ring */}
            <circle cx="0" cy="0" r="50" stroke="#c85a32" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            <circle cx="0" cy="0" r="46" stroke="#ded4c7" strokeWidth="0.8" fill="#faf7f2" />

            {/* 12 Hour tick marks on the clock face */}
            <g stroke="#38322c" strokeWidth="1.4">
              <line x1="0" y1="-44" x2="0" y2="-38" /> {/* 12 */}
              <line x1="44" y1="0" x2="38" y2="0" />   {/* 3 */}
              <line x1="0" y1="44" x2="0" y2="38" />   {/* 6 */}
              <line x1="-44" y1="0" x2="-38" y2="0" /> {/* 9 */}
            </g>
            <g stroke="#9e9183" strokeWidth="1">
              <line x1="22" y1="-38" x2="19" y2="-33" /> {/* 1 */}
              <line x1="38" y1="-22" x2="33" y2="-19" /> {/* 2 */}
              <line x1="38" y1="22" x2="33" y2="19" />   {/* 4 */}
              <line x1="22" y1="38" x2="19" y2="33" />   {/* 5 */}
              <line x1="-22" y1="38" x2="-19" y2="33" /> {/* 7 */}
              <line x1="-38" y1="22" x2="-33" y2="19" /> {/* 8 */}
              <line x1="-38" y1="-22" x2="-33" y2="-19" />{/* 10 */}
              <line x1="-22" y1="-38" x2="-19" y2="-33" />{/* 11 */}
            </g>

            {/* Dial Banner: 72hrs */}
            <rect x="-24" y="-28" width="48" height="14" rx="2" stroke="#c85a32" strokeWidth="0.9" fill="#fdfaf5" />
            <text x="0" y="-18" textAnchor="middle" fontSize="8" fontFamily="sans-serif" fontWeight="700" fill="#c85a32" letterSpacing="0.8">
              72hrs
            </text>

            {/* Clock Hands indicating patient slow aging */}
            {/* Hour hand pointing toward 3 o'clock */}
            <path d="M 0 0 L 22 -6" stroke="#24211e" strokeWidth="2.2" strokeLinecap="round" />
            {/* Minute hand pointing toward 12 o'clock */}
            <path d="M 0 0 L -4 -30" stroke="#24211e" strokeWidth="1.6" strokeLinecap="round" />
            {/* Fine second hand with counterweight */}
            <path d="M 0 6 L 0 -36" stroke="#c85a32" strokeWidth="1" strokeLinecap="round" />
            
            {/* Center brass cap */}
            <circle cx="0" cy="0" r="3" stroke="#24211e" strokeWidth="1" fill="#c85a32" />

            {/* Dial Subtext */}
            <text x="0" y="24" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#8a7c6e" letterSpacing="0.8">
              SLOW FERMENT
            </text>
          </g>

          {/* Bench scraper resting by the clock stand */}
          <g transform="translate(216, 194) rotate(-8)">
            <rect x="0" y="0" width="28" height="18" rx="2" stroke="#685d53" strokeWidth="1.2" fill="#ebe4da" />
            <path d="M 0,18 L 28,18" stroke="#c85a32" strokeWidth="1.6" />
            <rect x="4" y="3" width="20" height="4" rx="1" stroke="#4a4239" strokeWidth="1" fill="#38322c" />
          </g>
        </svg>

        {/* Minimal border accent badge */}
        <span className="absolute top-3 left-3 text-[11px] font-mono tracking-wider text-[#8b7e72] uppercase bg-[#efe7dc] px-2 py-0.5 rounded">
          Fig. 01 • The 72h Cold Rest
        </span>
      </div>
      {caption && (
        <figcaption className="mt-3 text-xs text-[#6e655d] text-center max-w-sm font-sans leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export const WoodOvenArt: React.FC<ArtProps> = ({ className = '', caption }) => {
  return (
    <figure className={`flex flex-col items-center ${className}`}>
      <div className="w-full aspect-[4/3] max-w-md bg-[#f4eee6]/80 rounded-xl p-6 border border-[#e2d8cc] flex items-center justify-center relative overflow-hidden group">
        {/* Subtle background grain */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8d7864_1px,transparent_1px)] [background-size:16px_16px]" />

        <svg
          viewBox="0 0 360 260"
          className="w-full h-full max-h-56 text-[#24211e]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Minimal line art of stone wood-fired pizza oven with glowing embers and peel"
        >
          {/* Ground & base line */}
          <line x1="30" y1="225" x2="330" y2="225" stroke="#7a7065" strokeWidth="1.5" />

          {/* Brick oven base stand */}
          <path d="M 65 225 L 65 170 L 295 170 L 295 225" stroke="#4a4239" strokeWidth="1.5" fill="#f8f4ed" />
          <line x1="65" y1="185" x2="295" y2="185" stroke="#8d8174" strokeWidth="1" strokeDasharray="3 3" />

          {/* Stacked split firewood under the oven */}
          <g stroke="#6e6255" strokeWidth="1.3" fill="#eae1d5">
            <ellipse cx="145" cy="205" rx="10" ry="6" />
            <ellipse cx="165" cy="205" rx="9" ry="6" />
            <ellipse cx="185" cy="205" rx="10" ry="6" />
            <ellipse cx="155" cy="195" rx="9" ry="5.5" />
            <ellipse cx="175" cy="195" rx="9" ry="5.5" />
            {/* Wood growth rings */}
            <circle cx="145" cy="205" r="3" strokeWidth="0.8" />
            <circle cx="165" cy="205" r="2.5" strokeWidth="0.8" />
            <circle cx="185" cy="205" r="3" strokeWidth="0.8" />
          </g>

          {/* Outer Masonry Dome */}
          <path
            d="M 60 170 C 60 85, 115 50, 180 50 C 245 50, 300 85, 300 170"
            stroke="#24211e"
            strokeWidth="2"
            fill="#f7f2ea"
          />

          {/* Chimney vent / flute on top */}
          <path d="M 160 52 L 160 30 L 200 30 L 200 52" stroke="#24211e" strokeWidth="1.5" fill="#f0e9df" />
          <line x1="155" y1="30" x2="205" y2="30" stroke="#24211e" strokeWidth="1.8" />

          {/* Stylized gentle warm smoke curl */}
          <path
            d="M 180 26 C 180 18, 175 14, 185 8"
            stroke="#a39587"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />

          {/* Oven Mouth Arch (Brick Keystone & Radial Arch) */}
          <path
            d="M 105 170 C 105 105, 255 105, 255 170"
            stroke="#24211e"
            strokeWidth="1.8"
            fill="#26211d"
          />

          {/* Oven Arch Surrounding Bricks */}
          <path
            d="M 95 170 C 95 95, 265 95, 265 170"
            stroke="#7a7065"
            strokeWidth="1.2"
            strokeDasharray="6 4"
          />

          {/* Hearth Inner Glow & Flame Embers */}
          <g>
            {/* Warm ember floor fill */}
            <path
              d="M 115 170 C 115 150, 140 140, 180 140 C 220 140, 245 150, 245 170 Z"
              fill="#c85a32"
              fillOpacity="0.25"
            />

            {/* Split Oak log with active flame on left of hearth */}
            <line x1="120" y1="165" x2="148" y2="155" stroke="#7a6c5f" strokeWidth="3" strokeLinecap="round" />
            
            {/* Minimal stylized flame flickers */}
            <path
              d="M 132 155 C 130 145, 138 140, 134 130 C 142 136, 144 148, 140 155"
              stroke="#c85a32"
              strokeWidth="1.5"
              fill="#d96a43"
              fillOpacity="0.6"
            />
            <path
              d="M 142 156 C 140 148, 148 144, 146 136 C 152 142, 153 150, 148 156"
              stroke="#e28859"
              strokeWidth="1.3"
              fill="#e28859"
              fillOpacity="0.5"
            />

            {/* Glowing ember sparks */}
            <circle cx="158" cy="142" r="1.2" fill="#c85a32" stroke="none" />
            <circle cx="166" cy="136" r="1" fill="#e28859" stroke="none" />
            <circle cx="178" cy="145" r="1.2" fill="#c85a32" stroke="none" />
          </g>

          {/* Long Birchwood Pizza Peel Inserting 12-inch Pie */}
          <g>
            {/* Long wooden handle extending diagonally from right */}
            <line x1="340" y1="195" x2="225" y2="162" stroke="#8d7764" strokeWidth="2.2" strokeLinecap="round" />

            {/* Aluminum / steel peel head */}
            <path
              d="M 225 162 L 182 150 C 172 147, 162 155, 168 165 L 205 175 Z"
              stroke="#59524a"
              strokeWidth="1.2"
              fill="#e0d7cb"
            />

            {/* 12-Inch Pizza on the stone hearth */}
            <ellipse cx="188" cy="162" rx="22" ry="7" stroke="#24211e" strokeWidth="1.4" fill="#faf6ef" />
            {/* Charred cornicione spots */}
            <ellipse cx="172" cy="163" rx="1.5" ry="0.8" fill="#24211e" stroke="none" />
            <ellipse cx="198" cy="160" rx="1.8" ry="0.8" fill="#24211e" stroke="none" />
            <ellipse cx="186" cy="165" rx="1.5" ry="0.7" fill="#24211e" stroke="none" />
            {/* Basil leaves */}
            <path d="M 183 161 C 185 159, 189 160, 188 163" stroke="#5d7a54" strokeWidth="1.5" />
          </g>

          {/* Minimal 900°F temperature badge */}
          <rect x="162" y="90" width="36" height="18" rx="3" stroke="#c85a32" strokeWidth="1" fill="#faf8f5" />
          <text x="180" y="103" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fontWeight="600" fill="#c85a32">
            900°F
          </text>
        </svg>

        {/* Minimal border accent badge */}
        <span className="absolute top-3 left-3 text-[11px] font-mono tracking-wider text-[#8b7e72] uppercase bg-[#efe7dc] px-2 py-0.5 rounded">
          Fig. 02 • The Stone Hearth
        </span>
      </div>
      {caption && (
        <figcaption className="mt-3 text-xs text-[#6e655d] text-center max-w-sm font-sans leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
