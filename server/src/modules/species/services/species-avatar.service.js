/**
 * Ultra-Detailed & Fun Endangered Species Profile Avatar Generator.
 * Creates lively, expressive, neo-brutalist animal character stickers & profile avatars
 * with rich multi-layer shading, species-specific anatomical details, quirky accessories,
 * expressive moods, and embedded CSS keyframe micro-animations.
 *
 * Brand Palette:
 * Primary: #FE4E1A (Orange), #0F534A (Forest Green), #F4002C (Bright Red), #4717AE (Deep Purple)
 * Secondary: #FFDD33 (Yellow), #9EFC5F (Lime), #FEB3FC (Pink), #18D7E8 (Cyan)
 */

const PALETTES = [
  { bg: '#FFDD33', accent: '#FE4E1A', border: '#121316', secondary: '#9EFC5F', dark: '#0F534A', text: '#121316' }, // Yellow / Orange
  { bg: '#9EFC5F', accent: '#0F534A', border: '#121316', secondary: '#FFDD33', dark: '#121316', text: '#FFFFFF' }, // Lime / Forest Green
  { bg: '#18D7E8', accent: '#4717AE', border: '#121316', secondary: '#FEB3FC', dark: '#0F534A', text: '#FFFFFF' }, // Cyan / Deep Purple
  { bg: '#FEB3FC', accent: '#F4002C', border: '#121316', secondary: '#FFDD33', dark: '#4717AE', text: '#FFFFFF' }, // Pink / Bright Red
  { bg: '#FE4E1A', accent: '#FFDD33', border: '#121316', secondary: '#18D7E8', dark: '#121316', text: '#121316' }, // Orange / Yellow
  { bg: '#4717AE', accent: '#9EFC5F', border: '#121316', secondary: '#FEB3FC', dark: '#FFDD33', text: '#121316' }, // Deep Purple / Lime
];

/**
 * Returns a deterministic palette from a slug.
 */
function getPaletteForSlug(slug = '') {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

/**
 * Deterministically picks a fun accessory & mood based on a username or seed string
 * if no explicit accessory or mood is passed in.
 */
function getDeterministicFlair(slug = '', seed = '') {
  const combined = `${slug}_${seed || '0'}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const ACCESSORIES = ['shades', 'party', 'headphones', 'boba', 'crown', 'explorer', 'flower', 'monocle', 'none'];
  const MOODS = ['happy', 'cool', 'excited', 'kawaii', 'curious', 'zen'];

  // Give ~70% chance of an accessory for automatic usernames
  const accIndex = absHash % ACCESSORIES.length;
  const moodIndex = (absHash >> 3) % MOODS.length;

  return {
    accessory: ACCESSORIES[accIndex],
    mood: MOODS[moodIndex],
  };
}

/**
 * Generates standard CSS keyframe animations embedded inside the SVG.
 */
function getGiphyAnimationStyles(animated = true) {
  if (!animated) return '';
  return `
    <style>
      @keyframes giphyFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-6px) rotate(0.8deg); }
      }
      @keyframes eyeBlink {
        0%, 88%, 100% { transform: scaleY(1); }
        94% { transform: scaleY(0.08); }
      }
      @keyframes starTwinkle {
        0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.85; }
        50% { transform: scale(1.35) rotate(45deg); opacity: 1; }
      }
      @keyframes earWiggle {
        0%, 100% { transform: rotate(0deg); }
        20% { transform: rotate(-4deg); }
        60% { transform: rotate(4deg); }
      }
      @keyframes bubbleFloat {
        0%, 100% { transform: translateY(0px) scale(0.95); opacity: 0.8; }
        50% { transform: translateY(-10px) scale(1.12); opacity: 1; }
      }
      @keyframes wingFlutter {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(5deg) scale(1.03); }
      }
      @keyframes tongueFlick {
        0%, 100% { transform: scaleX(0.85); }
        50% { transform: scaleX(1.2) translateY(2px); }
      }
      @keyframes headphonePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes partyHatWobble {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(8deg); }
      }
      @keyframes sparkleSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .giphy-char {
        animation: giphyFloat 3.2s ease-in-out infinite;
        transform-origin: 200px 200px;
      }
      .eye-anim {
        animation: eyeBlink 3.8s infinite;
        transform-origin: 200px 175px;
      }
      .star-1 {
        animation: starTwinkle 2.2s ease-in-out infinite;
        transform-origin: 65px 65px;
      }
      .star-2 {
        animation: starTwinkle 2.6s ease-in-out 0.8s infinite;
        transform-origin: 335px 75px;
      }
      .star-3 {
        animation: starTwinkle 2s ease-in-out 0.4s infinite;
        transform-origin: 340px 315px;
      }
      .bubble-1 {
        animation: bubbleFloat 2.8s ease-in-out infinite;
        transform-origin: center;
      }
      .bubble-2 {
        animation: bubbleFloat 2.2s ease-in-out 0.7s infinite;
        transform-origin: center;
      }
      .wing-anim {
        animation: wingFlutter 1.6s ease-in-out infinite;
        transform-origin: 200px 180px;
      }
      .ear-anim {
        animation: earWiggle 2.4s ease-in-out infinite;
        transform-origin: 200px 120px;
      }
      .tongue-anim {
        animation: tongueFlick 1.4s ease-in-out infinite;
        transform-origin: 200px 235px;
      }
      .party-anim {
        animation: partyHatWobble 2s ease-in-out infinite;
        transform-origin: 200px 100px;
      }
      .headphone-pulse {
        animation: headphonePulse 1.8s ease-in-out infinite;
        transform-origin: 200px 160px;
      }
      .sparkle-spin {
        animation: sparkleSpin 6s linear infinite;
        transform-origin: center;
      }
    </style>
  `;
}

/**
 * Standard Multi-Sparkle Eye Generator based on mood
 */
function renderEyes(mood, leftPos = { cx: 150, cy: 170 }, rightPos = { cx: 250, cy: 170 }, irisColor = '#18D7E8') {
  if (mood === 'cool') {
    return `
      <!-- Cool Winking / Smug Eyes -->
      <circle cx="${leftPos.cx}" cy="${leftPos.cy}" r="14" fill="#121316" />
      <circle cx="${leftPos.cx + 3}" cy="${leftPos.cy - 3}" r="4" fill="#FFFFFF" />
      <path d="M${rightPos.cx - 15},${rightPos.cy} Q${rightPos.cx},${rightPos.cy - 12} ${rightPos.cx + 15},${rightPos.cy}" stroke="#121316" stroke-width="6" fill="none" stroke-linecap="round" />
    `;
  }

  if (mood === 'excited') {
    return `
      <!-- Excited Star Eyes -->
      <g class="eye-anim">
        <polygon points="${leftPos.cx},${leftPos.cy - 16} ${leftPos.cx + 5},${leftPos.cy - 5} ${leftPos.cx + 16},${leftPos.cy} ${leftPos.cx + 5},${leftPos.cy + 5} ${leftPos.cx},${leftPos.cy + 16} ${leftPos.cx - 5},${leftPos.cy + 5} ${leftPos.cx - 16},${leftPos.cy} ${leftPos.cx - 5},${leftPos.cy - 5}" fill="#FFDD33" stroke="#121316" stroke-width="4" />
        <circle cx="${leftPos.cx}" cy="${leftPos.cy}" r="4" fill="#121316" />
        <polygon points="${rightPos.cx},${rightPos.cy - 16} ${rightPos.cx + 5},${rightPos.cy - 5} ${rightPos.cx + 16},${rightPos.cy} ${rightPos.cx + 5},${rightPos.cy + 5} ${rightPos.cx},${rightPos.cy + 16} ${rightPos.cx - 5},${rightPos.cy + 5} ${rightPos.cx - 16},${rightPos.cy} ${rightPos.cx - 5},${rightPos.cy - 5}" fill="#FFDD33" stroke="#121316" stroke-width="4" />
        <circle cx="${rightPos.cx}" cy="${rightPos.cy}" r="4" fill="#121316" />
      </g>
    `;
  }

  if (mood === 'kawaii') {
    return `
      <!-- Kawaii Liquid Sparkle Eyes -->
      <g class="eye-anim">
        <ellipse cx="${leftPos.cx}" cy="${leftPos.cy}" rx="18" ry="22" fill="#121316" />
        <circle cx="${leftPos.cx - 4}" cy="${leftPos.cy - 6}" r="7" fill="#FFFFFF" />
        <circle cx="${leftPos.cx + 5}" cy="${leftPos.cy + 5}" r="3.5" fill="#FFFFFF" />
        <ellipse cx="${rightPos.cx}" cy="${rightPos.cy}" rx="18" ry="22" fill="#121316" />
        <circle cx="${rightPos.cx - 4}" cy="${rightPos.cy - 6}" r="7" fill="#FFFFFF" />
        <circle cx="${rightPos.cx + 5}" cy="${rightPos.cy + 5}" r="3.5" fill="#FFFFFF" />
      </g>
    `;
  }

  if (mood === 'zen') {
    return `
      <!-- Zen Relaxed Crescent Smiling Eyes -->
      <path d="M${leftPos.cx - 16},${leftPos.cy + 2} Q${leftPos.cx},${leftPos.cy - 14} ${leftPos.cx + 16},${leftPos.cy + 2}" stroke="#121316" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M${rightPos.cx - 16},${rightPos.cy + 2} Q${rightPos.cx},${rightPos.cy - 14} ${rightPos.cx + 16},${rightPos.cy + 2}" stroke="#121316" stroke-width="6" fill="none" stroke-linecap="round" />
    `;
  }

  // Default Happy / Inquisitive Eyes
  return `
    <g class="eye-anim">
      <!-- Sclera -->
      <ellipse cx="${leftPos.cx}" cy="${leftPos.cy}" rx="16" ry="18" fill="#FFFFFF" stroke="#121316" stroke-width="4.5" />
      <ellipse cx="${rightPos.cx}" cy="${rightPos.cy}" rx="16" ry="18" fill="#FFFFFF" stroke="#121316" stroke-width="4.5" />
      <!-- Iris & Pupil -->
      <circle cx="${leftPos.cx}" cy="${leftPos.cy}" r="11" fill="#121316" />
      <circle cx="${rightPos.cx}" cy="${rightPos.cy}" r="11" fill="#121316" />
      <circle cx="${leftPos.cx}" cy="${leftPos.cy}" r="7" fill="${irisColor}" opacity="0.8" />
      <circle cx="${rightPos.cx}" cy="${rightPos.cy}" r="7" fill="${irisColor}" opacity="0.8" />
      <!-- Triple Highlights -->
      <circle cx="${leftPos.cx + 3}" cy="${leftPos.cy - 4}" r="4.5" fill="#FFFFFF" />
      <circle cx="${leftPos.cx - 4}" cy="${leftPos.cy + 4}" r="2" fill="#FFFFFF" />
      <circle cx="${rightPos.cx + 3}" cy="${rightPos.cy - 4}" r="4.5" fill="#FFFFFF" />
      <circle cx="${rightPos.cx - 4}" cy="${rightPos.cy + 4}" r="2" fill="#FFFFFF" />
    </g>
  `;
}

/**
 * Renders Whimsical Accessories Layer on top of character
 */
function renderAccessory(accessory, palette) {
  if (!accessory || accessory === 'none') return '';

  if (accessory === 'shades') {
    return `
      <!-- Neo-Brutalist Sunglasses -->
      <g class="accessory-layer">
        <rect x="120" y="152" width="75" height="42" rx="10" fill="#121316" stroke="#FFFFFF" stroke-width="4" />
        <rect x="205" y="152" width="75" height="42" rx="10" fill="#121316" stroke="#FFFFFF" stroke-width="4" />
        <rect x="190" y="165" width="20" height="8" fill="#121316" />
        <!-- Neon Glare Lines -->
        <line x1="130" y1="160" x2="155" y2="185" stroke="#18D7E8" stroke-width="5" stroke-linecap="round" />
        <line x1="160" y1="160" x2="175" y2="175" stroke="#FEB3FC" stroke-width="4" stroke-linecap="round" />
        <line x1="215" y1="160" x2="240" y2="185" stroke="#18D7E8" stroke-width="5" stroke-linecap="round" />
        <line x1="245" y1="160" x2="260" y2="175" stroke="#FEB3FC" stroke-width="4" stroke-linecap="round" />
      </g>
    `;
  }

  if (accessory === 'party') {
    return `
      <!-- Party Hat & Blower -->
      <g class="accessory-layer party-anim">
        <!-- Cone -->
        <polygon points="200,35 155,120 245,120" fill="#FE4E1A" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
        <polygon points="175,80 200,35 225,80" fill="#FFDD33" />
        <!-- Stripes & Pom-pom -->
        <line x1="165" y1="100" x2="235" y2="100" stroke="#18D7E8" stroke-width="6" stroke-linecap="round" />
        <circle cx="200" cy="30" r="14" fill="#FEB3FC" stroke="#121316" stroke-width="5" />
        <!-- Party Horn Blower -->
        <path d="M215,225 Q265,220 285,190" stroke="#FFDD33" stroke-width="9" fill="none" stroke-linecap="round" />
        <polygon points="280,185 295,195 285,205" fill="#F4002C" stroke="#121316" stroke-width="3" />
      </g>
    `;
  }

  if (accessory === 'headphones') {
    return `
      <!-- DJ Studio Over-Ear Headphones -->
      <g class="accessory-layer headphone-pulse">
        <path d="M95,185 A110,110 0 0,1 305,185" stroke="#121316" stroke-width="18" fill="none" stroke-linecap="round" />
        <path d="M100,185 A105,105 0 0,1 300,185" stroke="#FFDD33" stroke-width="8" fill="none" stroke-linecap="round" />
        <!-- Ear Cups -->
        <rect x="75" y="150" width="34" height="65" rx="17" fill="#121316" stroke="#9EFC5F" stroke-width="6" />
        <circle cx="92" cy="182" r="8" fill="#18D7E8" />
        <rect x="291" y="150" width="34" height="65" rx="17" fill="#121316" stroke="#9EFC5F" stroke-width="6" />
        <circle cx="308" cy="182" r="8" fill="#18D7E8" />
      </g>
    `;
  }

  if (accessory === 'crown') {
    return `
      <!-- Royal Gold Crown -->
      <g class="accessory-layer">
        <polygon points="140,110 150,55 175,80 200,45 225,80 250,55 260,110" fill="#FFDD33" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
        <!-- Ruby & Emerald Jewels -->
        <circle cx="150" cy="55" r="5" fill="#F4002C" />
        <circle cx="200" cy="45" r="6" fill="#4717AE" />
        <circle cx="250" cy="55" r="5" fill="#18D7E8" />
        <circle cx="200" cy="95" r="7" fill="#F4002C" stroke="#121316" stroke-width="3" />
        <rect x="145" y="105" width="110" height="10" rx="3" fill="#121316" />
      </g>
    `;
  }

  if (accessory === 'boba') {
    return `
      <!-- Boba Tea Drink Cup -->
      <g class="accessory-layer" transform="translate(25, -10)">
        <!-- Straw -->
        <line x1="265" y1="210" x2="285" y2="160" stroke="#FE4E1A" stroke-width="8" stroke-linecap="round" />
        <!-- Cup -->
        <polygon points="245,210 285,210 280,265 250,265" fill="#FFFFFF" stroke="#121316" stroke-width="5" stroke-linejoin="round" />
        <polygon points="247,222 283,222 278,263 252,263" fill="#FEB3FC" />
        <!-- Tapioca Pearls -->
        <circle cx="258" cy="255" r="4" fill="#121316" />
        <circle cx="268" cy="256" r="4" fill="#121316" />
        <circle cx="273" cy="248" r="4" fill="#121316" />
        <circle cx="262" cy="246" r="4" fill="#121316" />
      </g>
    `;
  }

  if (accessory === 'explorer') {
    return `
      <!-- Safari Explorer Pith Helmet -->
      <g class="accessory-layer">
        <path d="M130,115 Q200,45 270,115 Z" fill="#9EFC5F" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
        <ellipse cx="200" cy="115" rx="85" ry="14" fill="#FFDD33" stroke="#121316" stroke-width="6" />
        <!-- DX Badge -->
        <circle cx="200" cy="85" r="10" fill="#FE4E1A" stroke="#121316" stroke-width="4" />
        <circle cx="200" cy="85" r="4" fill="#FFFFFF" />
      </g>
    `;
  }

  if (accessory === 'flower') {
    return `
      <!-- Tropical Blossom -->
      <g class="accessory-layer">
        <circle cx="125" cy="120" r="14" fill="#FEB3FC" stroke="#121316" stroke-width="4" />
        <circle cx="145" cy="110" r="14" fill="#FEB3FC" stroke="#121316" stroke-width="4" />
        <circle cx="155" cy="130" r="14" fill="#FEB3FC" stroke="#121316" stroke-width="4" />
        <circle cx="140" cy="145" r="14" fill="#FEB3FC" stroke="#121316" stroke-width="4" />
        <circle cx="120" cy="140" r="14" fill="#FEB3FC" stroke="#121316" stroke-width="4" />
        <circle cx="137" cy="129" r="9" fill="#FFDD33" stroke="#121316" stroke-width="4" />
      </g>
    `;
  }

  if (accessory === 'monocle') {
    return `
      <!-- Brass Monocle -->
      <g class="accessory-layer">
        <circle cx="250" cy="170" r="22" fill="none" stroke="#FFDD33" stroke-width="6" />
        <line x1="250" y1="192" x2="270" y2="245" stroke="#FFDD33" stroke-width="4" stroke-linecap="round" />
        <line x1="240" y1="160" x2="260" y2="180" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
      </g>
    `;
  }

  return '';
}

/**
 * Handcrafted SVG character visuals for all specific species & taxonomic groups.
 * Features multi-layer shading, anatomical depth, and species flair.
 */
function getSpeciesCharacterSvg(slug, palette, mood = 'happy') {
  // ═════════════════════════════════════════════════════════════════════════════
  // 1. MAMMALS
  // ═════════════════════════════════════════════════════════════════════════════

  // Vaquita (Marine Mammal with dark eye rings & lipstick smile)
  if (slug.includes('vaquita')) {
    return `
      <!-- Vaquita Dorsal Fin with Depth -->
      <path d="M200,115 Q185,35 240,30 Q225,85 245,115 Z" fill="${palette.secondary}" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
      <path d="M205,100 Q195,50 230,45" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.6" stroke-linecap="round" />

      <!-- Head & Body with 3D Shading -->
      <ellipse cx="200" cy="200" rx="98" ry="88" fill="${palette.accent}" stroke="#121316" stroke-width="8" />
      <!-- Underbelly highlight -->
      <path d="M115,220 Q200,290 285,220 Q200,255 115,220 Z" fill="#FFFFFF" stroke="#121316" stroke-width="6" />

      <!-- Iconic Dark Eye Rings -->
      <g class="eye-anim">
        <circle cx="150" cy="175" r="24" fill="#121316" />
        <circle cx="250" cy="175" r="24" fill="#121316" />
        <circle cx="150" cy="175" r="15" fill="#18D7E8" />
        <circle cx="250" cy="175" r="15" fill="#18D7E8" />
        <circle cx="150" cy="175" r="9" fill="#121316" />
        <circle cx="250" cy="175" r="9" fill="#121316" />
        <circle cx="154" cy="170" r="4.5" fill="#FFFFFF" />
        <circle cx="147" cy="178" r="2" fill="#FFFFFF" />
        <circle cx="254" cy="170" r="4.5" fill="#FFFFFF" />
        <circle cx="247" cy="178" r="2" fill="#FFFFFF" />
      </g>

      <!-- Rosy Cheeks -->
      <ellipse cx="120" cy="205" rx="14" ry="8" fill="#F4002C" opacity="0.4" />
      <ellipse cx="280" cy="205" rx="14" ry="8" fill="#F4002C" opacity="0.4" />

      <!-- Iconic Dark Lips & Vaquita Smile -->
      <ellipse cx="200" cy="232" rx="30" ry="14" fill="#121316" />
      <path d="M176,232 Q200,254 224,232" stroke="#FEB3FC" stroke-width="5" fill="none" stroke-linecap="round" />

      <!-- Water Spout / Bubbles -->
      <circle class="bubble-1" cx="100" cy="95" r="14" fill="#18D7E8" stroke="#121316" stroke-width="4" />
      <circle class="bubble-2" cx="85" cy="65" r="8" fill="#18D7E8" stroke="#121316" stroke-width="3" />
      <circle class="bubble-1" cx="310" cy="105" r="16" fill="#18D7E8" stroke="#121316" stroke-width="4" />
    `;
  }

  // Rhinos (Javan Rhino, Sumatran Rhino, Black Rhino)
  if (slug.includes('rhino')) {
    const isSumatran = slug.includes('sumatran');
    return `
      <!-- Rhino Ears with Tuft -->
      <g class="ear-anim">
        <polygon points="105,135 120,65 160,115" fill="${palette.accent}" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <polygon points="120,120 128,80 148,110" fill="#FEB3FC" />
        <polygon points="295,135 280,65 240,115" fill="${palette.accent}" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <polygon points="280,120 272,80 252,110" fill="#FEB3FC" />
        ${isSumatran ? '<path d="M120,65 Q110,45 115,40 M280,65 Q290,45 285,40" stroke="#121316" stroke-width="5" fill="none" stroke-linecap="round" />' : ''}
      </g>

      <!-- Head & Armor Plating Structure -->
      <ellipse cx="200" cy="205" rx="98" ry="88" fill="${palette.accent}" stroke="#121316" stroke-width="8" />
      <!-- 3D Armor Fold Lines -->
      <path d="M115,175 Q200,155 285,175" stroke="#121316" stroke-width="6" fill="none" opacity="0.25" />
      <path d="M125,200 Q200,185 275,200" stroke="#121316" stroke-width="5" fill="none" opacity="0.2" />
      
      <!-- Prehistoric Rhino Horn with Ridge Highlight -->
      <path d="M182,200 Q198,80 218,75 Q218,155 218,200 Z" fill="#FFDD33" stroke="#121316" stroke-width="7.5" stroke-linejoin="round" />
      <path d="M190,185 Q202,100 212,90" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.7" stroke-linecap="round" />
      ${slug.includes('sumatran') || slug.includes('black') ? '<polygon points="190,145 210,115 210,145" fill="#FFDD33" stroke="#121316" stroke-width="5.5" />' : ''}

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 168 }, { cx: 252, cy: 168 })}

      <!-- Friendly Snout with Depth -->
      <ellipse cx="200" cy="238" rx="46" ry="26" fill="${palette.secondary}" stroke="#121316" stroke-width="6" />
      <ellipse cx="184" cy="232" rx="7" ry="11" fill="#121316" />
      <ellipse cx="216" cy="232" rx="7" ry="11" fill="#121316" />
      <path d="M188,248 Q200,260 212,248" stroke="#121316" stroke-width="5.5" fill="none" stroke-linecap="round" />
    `;
  }

  // Saola ("Asian Unicorn" with parallel needle horns)
  if (slug.includes('saola')) {
    return `
      <!-- Iconic Long Needle Horns with Golden Rings -->
      <path d="M172,125 L158,15 L182,120" fill="#121316" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
      <path d="M228,125 L242,15 L218,120" fill="#121316" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
      <line x1="165" y1="50" x2="175" y2="52" stroke="#FFDD33" stroke-width="4" stroke-linecap="round" />
      <line x1="168" y1="80" x2="178" y2="82" stroke="#FFDD33" stroke-width="4" stroke-linecap="round" />
      <line x1="235" y1="50" x2="225" y2="52" stroke="#FFDD33" stroke-width="4" stroke-linecap="round" />
      <line x1="232" y1="80" x2="222" y2="82" stroke="#FFDD33" stroke-width="4" stroke-linecap="round" />

      <!-- Saola Ears -->
      <polygon points="115,130 90,80 140,115" fill="${palette.accent}" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
      <polygon points="115,120 100,90 130,112" fill="#FEB3FC" />
      <polygon points="285,130 310,80 260,115" fill="${palette.accent}" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
      <polygon points="285,120 300,90 270,112" fill="#FEB3FC" />

      <!-- Head -->
      <ellipse cx="200" cy="195" rx="84" ry="90" fill="${palette.accent}" stroke="#121316" stroke-width="8" />

      <!-- Signature White Facial Stripes & Stars -->
      <path d="M145,145 L168,225 M255,145 L232,225" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" />
      <circle cx="158" cy="195" r="7" fill="#FFFFFF" />
      <circle cx="242" cy="195" r="7" fill="#FFFFFF" />

      <!-- Gentle Soulful Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 168 }, { cx: 252, cy: 168 })}

      <!-- Snout -->
      <ellipse cx="200" cy="236" rx="28" ry="20" fill="#121316" />
      <ellipse cx="191" cy="232" rx="4" ry="6" fill="#FFFFFF" />
      <ellipse cx="209" cy="232" rx="4" ry="6" fill="#FFFFFF" />
      <path d="M191,244 Q200,252 209,244" stroke="#FEB3FC" stroke-width="4" fill="none" stroke-linecap="round" />
    `;
  }

  // Big Cats (Amur Leopard, Snow Leopard, Cheetah, Iberian Lynx, Sumatran Tiger)
  if (slug.includes('leopard') || slug.includes('cheetah') || slug.includes('lynx') || slug.includes('tiger')) {
    const isSnow = slug.includes('snow');
    const isCheetah = slug.includes('cheetah');
    const isLynx = slug.includes('lynx');
    const isTiger = slug.includes('tiger');
    const catAccent = isSnow ? '#18D7E8' : isTiger ? '#FE4E1A' : palette.accent;

    return `
      <!-- Cat Ears with Depth -->
      <g class="ear-anim">
        <polygon points="115,130 145,45 180,125" fill="${catAccent}" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <polygon points="130,120 145,70 165,120" fill="#FEB3FC" stroke="#121316" stroke-width="3" />
        <polygon points="220,125 255,45 285,130" fill="${catAccent}" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <polygon points="235,120 255,70 270,120" fill="#FEB3FC" stroke="#121316" stroke-width="3" />
        ${isLynx ? `
          <!-- Lynx Signature Black Ear Tufts -->
          <path d="M145,45 L140,15 M255,45 L260,15" stroke="#121316" stroke-width="9" stroke-linecap="round" />
        ` : ''}
      </g>

      <!-- Head with Rim Highlight -->
      <ellipse cx="200" cy="195" rx="94" ry="84" fill="${catAccent}" stroke="#121316" stroke-width="8" />

      <!-- Markings (Tiger Stripes / Cheetah Tearlines / Leopard Rosettes) -->
      ${isTiger ? `
        <!-- Bold Tiger Flame Stripes -->
        <polygon points="105,180 142,185 105,195" fill="#121316" />
        <polygon points="295,180 258,185 295,195" fill="#121316" />
        <polygon points="200,115 188,140 212,140" fill="#121316" />
        <polygon points="140,135 155,145 142,150" fill="#121316" />
        <polygon points="260,135 245,145 258,150" fill="#121316" />
      ` : isCheetah ? `
        <!-- Cheetah Black Tearlines & Spots -->
        <path d="M152,175 Q158,215 174,232" stroke="#121316" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M248,175 Q242,215 226,232" stroke="#121316" stroke-width="8" fill="none" stroke-linecap="round" />
        <circle cx="125" cy="155" r="7" fill="#121316" />
        <circle cx="275" cy="155" r="7" fill="#121316" />
        <circle cx="200" cy="135" r="6" fill="#121316" />
      ` : `
        <!-- Leopard Spots & Rosettes -->
        <circle cx="135" cy="150" r="9" fill="#121316" opacity="0.35" />
        <circle cx="135" cy="150" r="5" fill="${palette.secondary}" />
        <circle cx="265" cy="150" r="9" fill="#121316" opacity="0.35" />
        <circle cx="265" cy="150" r="5" fill="${palette.secondary}" />
        <circle cx="200" cy="135" r="10" fill="#121316" opacity="0.35" />
        <circle cx="200" cy="135" r="6" fill="${palette.secondary}" />
      `}

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 168 }, { cx: 252, cy: 168 }, isTiger ? '#FFDD33' : '#18D7E8')}

      <!-- Snout & Whiskers -->
      <ellipse cx="200" cy="228" rx="34" ry="22" fill="#FFFFFF" stroke="#121316" stroke-width="6.5" />
      <polygon points="188,216 212,216 200,228" fill="#F4002C" stroke="#121316" stroke-width="2" />
      <path d="M188,232 Q200,244 212,232" stroke="#121316" stroke-width="5" fill="none" stroke-linecap="round" />
      <!-- Whiskers -->
      <line x1="100" y1="222" x2="155" y2="228" stroke="#121316" stroke-width="5" stroke-linecap="round" />
      <line x1="100" y1="238" x2="155" y2="235" stroke="#121316" stroke-width="5" stroke-linecap="round" />
      <line x1="300" y1="222" x2="245" y2="228" stroke="#121316" stroke-width="5" stroke-linecap="round" />
      <line x1="300" y1="238" x2="245" y2="235" stroke="#121316" stroke-width="5" stroke-linecap="round" />
    `;
  }

  // Primates (Gorillas, Orangutans, Bonobos, Monkeys)
  if (slug.includes('gorilla') || slug.includes('orangutan') || slug.includes('bonobo') || slug.includes('chimpanzee') || slug.includes('monkey')) {
    const isOrangutan = slug.includes('orangutan');
    const isGorilla = slug.includes('gorilla');
    const apeColor = isOrangutan ? '#FE4E1A' : '#121316';

    return `
      <!-- Primate Round Ears with Folds -->
      <g class="ear-anim">
        <circle cx="100" cy="190" r="36" fill="${apeColor}" stroke="#121316" stroke-width="8" />
        <circle cx="100" cy="190" r="22" fill="#FEB3FC" />
        <circle cx="300" cy="190" r="36" fill="${apeColor}" stroke="#121316" stroke-width="8" />
        <circle cx="300" cy="190" r="22" fill="#FEB3FC" />
      </g>

      <!-- Head / Sagittal Crest -->
      <ellipse cx="200" cy="190" rx="88" ry="${isGorilla ? 98 : 90}" fill="${apeColor}" stroke="#121316" stroke-width="8" />

      <!-- Orangutan Cheek Flanges -->
      ${isOrangutan ? `
        <ellipse cx="115" cy="205" rx="28" ry="44" fill="#FE4E1A" stroke="#121316" stroke-width="6.5" />
        <ellipse cx="285" cy="205" rx="28" ry="44" fill="#FE4E1A" stroke="#121316" stroke-width="6.5" />
      ` : ''}

      <!-- Inner Face Mask -->
      <ellipse cx="200" cy="205" rx="68" ry="62" fill="#FFEAA7" stroke="#121316" stroke-width="6.5" />

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 165, cy: 175 }, { cx: 235, cy: 175 }, '#FFDD33')}

      <!-- Nostrils -->
      <ellipse cx="188" cy="210" rx="6" ry="9" fill="#121316" />
      <ellipse cx="212" cy="210" rx="6" ry="9" fill="#121316" />

      <!-- Joyful Wide Smile with Teeth -->
      <path d="M162,230 Q200,268 238,230" stroke="#121316" stroke-width="6.5" fill="#F4002C" stroke-linecap="round" />
      <path d="M178,248 Q200,236 222,248" fill="#FFFFFF" stroke="#121316" stroke-width="2" />
    `;
  }

  // Pangolin (Sunda Pangolin with Articulated Scales)
  if (slug.includes('pangolin')) {
    return `
      <!-- Pangolin Curled Body & Head -->
      <ellipse cx="200" cy="195" rx="90" ry="85" fill="#FE4E1A" stroke="#121316" stroke-width="8" />
      
      <!-- Articulated Overlapping Scale Carapace -->
      <path d="M130,130 L160,110 L190,130 L160,150 Z" fill="#FFDD33" stroke="#121316" stroke-width="5" stroke-linejoin="round" />
      <path d="M210,130 L240,110 L270,130 L240,150 Z" fill="#FFDD33" stroke="#121316" stroke-width="5" stroke-linejoin="round" />
      <path d="M160,160 L190,140 L220,160 L190,180 Z" fill="#FFDD33" stroke="#121316" stroke-width="5" stroke-linejoin="round" />
      <path d="M120,180 L150,160 L180,180 L150,200 Z" fill="#FFDD33" stroke="#121316" stroke-width="5" stroke-linejoin="round" />
      <path d="M220,180 L250,160 L280,180 L250,200 Z" fill="#FFDD33" stroke="#121316" stroke-width="5" stroke-linejoin="round" />

      <!-- Cute Curved Snout -->
      <ellipse cx="200" cy="235" rx="28" ry="18" fill="#FEB3FC" stroke="#121316" stroke-width="6" />
      <ellipse cx="200" cy="230" rx="5" ry="4" fill="#121316" />

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 155, cy: 170 }, { cx: 245, cy: 170 })}
    `;
  }

  // Elephant (Asian Elephant with Large Ears & Ridged Trunk)
  if (slug.includes('elephant')) {
    return `
      <!-- Flapping Elephant Ears -->
      <g class="ear-anim">
        <ellipse cx="95" cy="180" rx="45" ry="55" fill="${palette.accent}" stroke="#121316" stroke-width="8" transform="rotate(-15 95 180)" />
        <ellipse cx="95" cy="180" rx="30" ry="40" fill="#FEB3FC" />
        <ellipse cx="305" cy="180" rx="45" ry="55" fill="${palette.accent}" stroke="#121316" stroke-width="8" transform="rotate(15 305 180)" />
        <ellipse cx="305" cy="180" rx="30" ry="40" fill="#FEB3FC" />
      </g>

      <!-- Head Dome -->
      <ellipse cx="200" cy="190" rx="88" ry="82" fill="${palette.accent}" stroke="#121316" stroke-width="8" />

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 150, cy: 165 }, { cx: 250, cy: 165 })}

      <!-- Ivory Tusks -->
      <path d="M165,220 Q145,265 130,260 Q150,240 170,225 Z" fill="#FFFFFF" stroke="#121316" stroke-width="5" />
      <path d="M235,220 Q255,265 270,260 Q250,240 230,225 Z" fill="#FFFFFF" stroke="#121316" stroke-width="5" />

      <!-- Ridged Curved Trunk -->
      <path d="M185,205 Q200,285 240,270 Q245,250 215,250 Q205,230 215,205 Z" fill="${palette.secondary}" stroke="#121316" stroke-width="6.5" stroke-linejoin="round" />
      <line x1="192" y1="225" x2="210" y2="225" stroke="#121316" stroke-width="4" stroke-linecap="round" />
      <line x1="195" y1="242" x2="212" y2="242" stroke="#121316" stroke-width="4" stroke-linecap="round" />
      <!-- Water Spray Sparkles from Trunk -->
      <circle class="bubble-1" cx="260" cy="245" r="7" fill="#18D7E8" stroke="#121316" stroke-width="3" />
      <circle class="bubble-2" cx="280" cy="235" r="5" fill="#18D7E8" stroke="#121316" stroke-width="2.5" />
    `;
  }

  // Red Panda
  if (slug.includes('red_panda')) {
    return `
      <!-- Fluffy Tri-Color Ears -->
      <g class="ear-anim">
        <polygon points="105,130 135,45 175,120" fill="#FFFFFF" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <polygon points="122,115 135,70 158,115" fill="#FEB3FC" />
        <polygon points="295,130 265,45 225,120" fill="#FFFFFF" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <polygon points="278,115 265,70 242,115" fill="#FEB3FC" />
      </g>

      <!-- Rust-Red Head -->
      <ellipse cx="200" cy="195" rx="92" ry="82" fill="#FE4E1A" stroke="#121316" stroke-width="8" />

      <!-- White Eyebrow Patches & Cheek Badges -->
      <circle cx="152" cy="138" r="15" fill="#FFFFFF" />
      <circle cx="248" cy="138" r="15" fill="#FFFFFF" />
      <ellipse cx="120" cy="205" rx="20" ry="14" fill="#FFFFFF" />
      <ellipse cx="280" cy="205" rx="20" ry="14" fill="#FFFFFF" />

      <!-- Dark Tearlines -->
      <path d="M148,175 L148,218 M252,175 L252,218" stroke="#121316" stroke-width="8" stroke-linecap="round" />

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 168 }, { cx: 252, cy: 168 })}

      <!-- Snout & Bamboo Snack -->
      <ellipse cx="200" cy="228" rx="30" ry="20" fill="#FFFFFF" stroke="#121316" stroke-width="6.5" />
      <polygon points="190,216 210,216 200,228" fill="#121316" />
      <path d="M188,232 Q200,244 212,232" stroke="#121316" stroke-width="5" fill="none" stroke-linecap="round" />
      <!-- Bamboo Stalk -->
      <path d="M210,238 Q250,232 285,210" stroke="#9EFC5F" stroke-width="8" stroke-linecap="round" />
      <ellipse cx="285" cy="210" rx="12" ry="6" fill="#9EFC5F" stroke="#121316" stroke-width="3" />
    `;
  }

  // Bears, Koala, Pygmy Hippo, Giant Panda
  if (slug.includes('polar_bear') || slug.includes('panda') || slug.includes('koala') || slug.includes('hippo')) {
    const isKoala = slug.includes('koala');
    const isHippo = slug.includes('hippo');
    const isPolar = slug.includes('polar');
    const isPanda = slug.includes('panda') && !slug.includes('red');

    return `
      <!-- Ears -->
      <g class="ear-anim">
        <circle cx="112" cy="115" r="${isKoala ? 42 : 32}" fill="${isPolar ? '#FFFFFF' : isKoala ? '#9EFC5F' : '#121316'}" stroke="#121316" stroke-width="7.5" />
        <circle cx="112" cy="115" r="${isKoala ? 26 : 16}" fill="#FEB3FC" />
        <circle cx="288" cy="115" r="${isKoala ? 42 : 32}" fill="${isPolar ? '#FFFFFF' : isKoala ? '#9EFC5F' : '#121316'}" stroke="#121316" stroke-width="7.5" />
        <circle cx="288" cy="115" r="${isKoala ? 26 : 16}" fill="#FEB3FC" />
      </g>

      <!-- Head with Rim Highlight -->
      <ellipse cx="200" cy="200" rx="92" ry="86" fill="${isPolar ? '#FFFFFF' : isHippo ? '#4717AE' : palette.accent}" stroke="#121316" stroke-width="8" />

      <!-- Panda Eye Patches -->
      ${isPanda ? `
        <ellipse cx="148" cy="170" rx="26" ry="32" fill="#121316" transform="rotate(-15 148 170)" />
        <ellipse cx="252" cy="170" rx="26" ry="32" fill="#121316" transform="rotate(15 252 170)" />
      ` : ''}

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 168 }, { cx: 252, cy: 168 })}

      <!-- Big Koala Nose or Bear Snout -->
      ${isKoala ? `
        <ellipse cx="200" cy="210" rx="26" ry="36" fill="#121316" stroke="#FFFFFF" stroke-width="3.5" />
        <path d="M188,252 Q200,262 212,252" stroke="#121316" stroke-width="5" fill="none" stroke-linecap="round" />
      ` : `
        <ellipse cx="200" cy="232" rx="38" ry="26" fill="${isHippo ? '#FEB3FC' : '#FFFFFF'}" stroke="#121316" stroke-width="6.5" />
        <ellipse cx="${isHippo ? 184 : 200}" cy="${isHippo ? 222 : 220}" rx="${isHippo ? 7 : 14}" ry="${isHippo ? 10 : 9}" fill="#121316" />
        ${isHippo ? '<ellipse cx="216" cy="222" rx="7" ry="10" fill="#121316" />' : ''}
        <path d="M188,238 Q200,248 212,238" stroke="#121316" stroke-width="5" fill="none" stroke-linecap="round" />
      `}
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. MARINE & AQUATIC
  // ═════════════════════════════════════════════════════════════════════════════

  // Whales (Blue Whale, Right Whale)
  if (slug.includes('whale') && !slug.includes('shark')) {
    const isRightWhale = slug.includes('right');
    return `
      <!-- Spouting Star & Heart Water Geyser -->
      <path class="bubble-1" d="M200,105 Q165,30 135,48 M200,105 Q235,30 265,48" stroke="#18D7E8" stroke-width="9" fill="none" stroke-linecap="round" />
      <polygon class="star-1" points="200,20 206,35 220,35 210,44 214,58 200,49 186,58 190,44 180,35 194,35" fill="#FFDD33" stroke="#121316" stroke-width="3" />

      <!-- Massive Whale Body with Gradient Depth -->
      <ellipse cx="200" cy="210" rx="104" ry="82" fill="${palette.accent}" stroke="#121316" stroke-width="8" />

      <!-- Barnacle Callosities (Right Whale) -->
      ${isRightWhale ? `
        <ellipse cx="178" cy="132" rx="16" ry="9" fill="#FFDD33" stroke="#121316" stroke-width="4" />
        <ellipse cx="222" cy="132" rx="16" ry="9" fill="#FFDD33" stroke="#121316" stroke-width="4" />
        <ellipse cx="200" cy="122" rx="22" ry="11" fill="#FFDD33" stroke="#121316" stroke-width="4" />
      ` : ''}

      <!-- Ventral Throat Pleats -->
      <path d="M125,225 Q200,268 275,225 M135,242 Q200,280 265,242" stroke="#121316" stroke-width="5.5" fill="none" stroke-linecap="round" />

      <!-- Whale Eyes -->
      ${renderEyes(mood, { cx: 140, cy: 180 }, { cx: 260, cy: 180 }, '#18D7E8')}

      <!-- Majestic Whale Smile -->
      <path d="M148,212 Q200,248 252,212" stroke="#121316" stroke-width="7" fill="none" stroke-linecap="round" />
    `;
  }

  // Yangtze Finless Porpoise & Amazon River Dolphin (Boto)
  if (slug.includes('porpoise') || slug.includes('dolphin')) {
    const isPinkBoto = slug.includes('amazon') || slug.includes('boto');
    const dolphinColor = isPinkBoto ? '#FEB3FC' : '#18D7E8';

    return `
      <!-- Dolphin Head & Melon -->
      <ellipse cx="200" cy="190" rx="94" ry="84" fill="${dolphinColor}" stroke="#121316" stroke-width="8" />

      <!-- Long Slender Beak (Boto) -->
      ${isPinkBoto ? `
        <polygon points="172,215 228,215 200,288" fill="#FEB3FC" stroke="#121316" stroke-width="6.5" stroke-linejoin="round" />
      ` : ''}

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 165 }, { cx: 252, cy: 165 })}

      <!-- Rosy Cheeks -->
      <ellipse cx="125" cy="190" rx="16" ry="10" fill="#F4002C" opacity="0.5" />
      <ellipse cx="275" cy="190" rx="16" ry="10" fill="#F4002C" opacity="0.5" />

      <!-- Smiling Angel Grin -->
      <path d="M158,210 Q200,248 242,210" stroke="#121316" stroke-width="7" fill="#FFFFFF" stroke-linecap="round" />

      <!-- Water Bubbles -->
      <circle class="bubble-1" cx="90" cy="115" r="15" fill="#18D7E8" stroke="#121316" stroke-width="4" />
      <circle class="bubble-2" cx="310" cy="95" r="11" fill="#18D7E8" stroke="#121316" stroke-width="4" />
    `;
  }

  // Sea Turtles (Hawksbill, Leatherback)
  if (slug.includes('turtle')) {
    return `
      <!-- Swimming Flippers with Scale Scallops -->
      <g class="wing-anim">
        <ellipse cx="95" cy="170" rx="44" ry="22" fill="${palette.secondary}" stroke="#121316" stroke-width="7" transform="rotate(-30 95 170)" />
        <ellipse cx="305" cy="170" rx="44" ry="22" fill="${palette.secondary}" stroke="#121316" stroke-width="7" transform="rotate(30 305 170)" />
      </g>

      <!-- Turtle Shell -->
      <ellipse cx="200" cy="205" rx="88" ry="94" fill="${palette.accent}" stroke="#121316" stroke-width="8" />

      <!-- Geometric Carapace Scutes with 3D Bevel -->
      <polygon points="200,140 235,175 235,215 200,250 165,215 165,175" fill="#FFDD33" stroke="#121316" stroke-width="5.5" />
      <line x1="200" y1="140" x2="200" y2="115" stroke="#121316" stroke-width="5" />
      <line x1="235" y1="175" x2="280" y2="165" stroke="#121316" stroke-width="5" />
      <line x1="235" y1="215" x2="280" y2="232" stroke="#121316" stroke-width="5" />
      <line x1="165" y1="175" x2="120" y2="165" stroke="#121316" stroke-width="5" />
      <line x1="165" y1="215" x2="120" y2="232" stroke="#121316" stroke-width="5" />

      <!-- Cute Turtle Head -->
      <ellipse cx="200" cy="112" rx="38" ry="32" fill="${palette.secondary}" stroke="#121316" stroke-width="7.5" />
      ${renderEyes(mood, { cx: 185, cy: 108 }, { cx: 215, cy: 108 })}
      <path d="M190,124 Q200,132 210,124" stroke="#121316" stroke-width="3.5" fill="none" stroke-linecap="round" />
    `;
  }

  // Sharks, Rays, Sawfish, Dugong, Coelacanth
  if (slug.includes('shark') || slug.includes('manta') || slug.includes('sawfish') || slug.includes('dugong') || slug.includes('coelacanth')) {
    const isHammerhead = slug.includes('hammerhead');
    const isManta = slug.includes('manta');
    const isSawfish = slug.includes('sawfish');
    const isDugong = slug.includes('dugong');

    if (isHammerhead) {
      return `
        <!-- Hammerhead Cephalofoil with 3D Contours -->
        <rect x="65" y="138" width="270" height="64" rx="22" fill="${palette.accent}" stroke="#121316" stroke-width="8" />
        <polygon points="175,138 200,60 225,138" fill="${palette.secondary}" stroke="#121316" stroke-width="7.5" stroke-linejoin="round" />
        <ellipse cx="200" cy="222" rx="80" ry="64" fill="${palette.accent}" stroke="#121316" stroke-width="8" />

        <!-- Eyes at extreme edges with highlights -->
        <circle cx="92" cy="170" r="16" fill="#121316" stroke="#FFFFFF" stroke-width="3.5" />
        <circle cx="92" cy="170" r="8" fill="#18D7E8" />
        <circle cx="95" cy="166" r="3.5" fill="#FFFFFF" />
        <circle cx="308" cy="170" r="16" fill="#121316" stroke="#FFFFFF" stroke-width="3.5" />
        <circle cx="308" cy="170" r="8" fill="#18D7E8" />
        <circle cx="311" cy="166" r="3.5" fill="#FFFFFF" />

        <!-- Sharp Shark Smile with Teeth -->
        <path d="M162,225 Q200,264 238,225 Z" fill="#FFFFFF" stroke="#121316" stroke-width="6.5" />
        <polygon points="172,225 182,236 192,225" fill="#121316" />
        <polygon points="208,225 218,236 228,225" fill="#121316" />
      `;
    }

    if (isManta) {
      return `
        <!-- Giant Manta Wings -->
        <g class="wing-anim">
          <polygon points="200,115 35,200 115,265 200,235 285,265 365,200" fill="${palette.accent}" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        </g>
        <!-- Cephalic Fin Horns -->
        <ellipse cx="168" cy="95" rx="16" ry="28" fill="${palette.secondary}" stroke="#121316" stroke-width="6.5" transform="rotate(-15 168 95)" />
        <ellipse cx="232" cy="95" rx="16" ry="28" fill="${palette.secondary}" stroke="#121316" stroke-width="6.5" transform="rotate(15 232 95)" />
        <!-- White Chevron Glow Racing Stripe -->
        <path d="M145,158 L200,192 L255,158" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" fill="none" />
        <!-- Eyes -->
        ${renderEyes(mood, { cx: 148, cy: 128 }, { cx: 252, cy: 128 })}
      `;
    }

    if (isSawfish) {
      return `
        <!-- Sawfish Body -->
        <ellipse cx="200" cy="212" rx="84" ry="74" fill="${palette.accent}" stroke="#121316" stroke-width="8" />
        <!-- Toothed Rostrum Saw Blade with Highlight -->
        <rect x="186" y="40" width="28" height="142" rx="8" fill="#FFDD33" stroke="#121316" stroke-width="6.5" />
        <!-- Saw Teeth -->
        <line x1="170" y1="60" x2="186" y2="60" stroke="#121316" stroke-width="5.5" stroke-linecap="round" />
        <line x1="214" y1="60" x2="230" y2="60" stroke="#121316" stroke-width="5.5" stroke-linecap="round" />
        <line x1="170" y1="90" x2="186" y2="90" stroke="#121316" stroke-width="5.5" stroke-linecap="round" />
        <line x1="214" y1="90" x2="230" y2="90" stroke="#121316" stroke-width="5.5" stroke-linecap="round" />
        <line x1="170" y1="120" x2="186" y2="120" stroke="#121316" stroke-width="5.5" stroke-linecap="round" />
        <line x1="214" y1="120" x2="230" y2="120" stroke="#121316" stroke-width="5.5" stroke-linecap="round" />
        <!-- Eyes -->
        ${renderEyes(mood, { cx: 152, cy: 180 }, { cx: 248, cy: 180 })}
      `;
    }

    if (isDugong) {
      return `
        <!-- Dugong Friendly Sea Cow -->
        <ellipse cx="200" cy="195" rx="94" ry="88" fill="${palette.accent}" stroke="#121316" stroke-width="8" />
        <!-- Round Snout & Whiskers -->
        <ellipse cx="200" cy="226" rx="52" ry="34" fill="#FFFFFF" stroke="#121316" stroke-width="6.5" />
        <ellipse cx="184" cy="216" rx="6" ry="9" fill="#121316" />
        <ellipse cx="216" cy="216" rx="6" ry="9" fill="#121316" />
        <path d="M188,240 Q200,250 212,240" stroke="#121316" stroke-width="5.5" fill="none" stroke-linecap="round" />
        <!-- Seagrass Snack in Mouth -->
        <path d="M210,242 Q252,254 274,228" stroke="#9EFC5F" stroke-width="8" stroke-linecap="round" />
        <!-- Sweet Eyes -->
        ${renderEyes(mood, { cx: 148, cy: 165 }, { cx: 252, cy: 165 })}
      `;
    }

    // Whale Shark (Constellation Star Polka Dots)
    return `
      <!-- Dorsal Fin -->
      <polygon points="175,115 200,45 225,115" fill="${palette.secondary}" stroke="#121316" stroke-width="7.5" />
      <!-- Wide Head -->
      <ellipse cx="200" cy="200" rx="98" ry="88" fill="#18D7E8" stroke="#121316" stroke-width="8" />
      <!-- Constellation Polka Dots -->
      <circle cx="138" cy="138" r="6" fill="#FFFFFF" />
      <circle cx="170" cy="128" r="7" fill="#FFFFFF" />
      <circle cx="200" cy="138" r="6" fill="#FFFFFF" />
      <circle cx="230" cy="128" r="7" fill="#FFFFFF" />
      <circle cx="262" cy="138" r="6" fill="#FFFFFF" />
      <circle cx="128" cy="170" r="7" fill="#FFFFFF" />
      <circle cx="272" cy="170" r="7" fill="#FFFFFF" />
      <!-- Eyes -->
      ${renderEyes(mood, { cx: 138, cy: 175 }, { cx: 262, cy: 175 })}
      <!-- Wide Vacuum Whale Shark Smile -->
      <rect x="145" y="215" width="110" height="28" rx="14" fill="#121316" />
      <path d="M162,226 Q200,238 238,226" stroke="#FFFFFF" stroke-width="3.5" fill="none" stroke-linecap="round" />
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. BIRDS
  // ═════════════════════════════════════════════════════════════════════════════

  if (slug.includes('kakapo') || slug.includes('eagle') || slug.includes('macaw') || slug.includes('condor') ||
      slug.includes('sandpiper') || slug.includes('crane') || slug.includes('bustard') || slug.includes('myna') ||
      slug.includes('shoebill') || slug.includes('kiwi') || slug.includes('bird') || slug.includes('hornbill')) {

    const isKakapo = slug.includes('kakapo');
    const isPhilippineEagle = slug.includes('philippine_eagle');
    const isHarpy = slug.includes('harpy');
    const isMacaw = slug.includes('macaw');
    const isShoebill = slug.includes('shoebill');
    const isKiwi = slug.includes('kiwi');
    const isHornbill = slug.includes('hornbill');
    const isMyna = slug.includes('myna');
    const isCrane = slug.includes('crane') || slug.includes('bustard');

    const birdColor = isKakapo ? '#9EFC5F' : isMacaw ? '#18D7E8' : isMyna ? '#FFFFFF' : isKiwi ? '#FE4E1A' : palette.accent;

    return `
      <!-- Crest Feathers -->
      ${isPhilippineEagle ? `
        <!-- Regal Shaggy Lion-Mane Crest -->
        <path d="M155,110 L125,35 L168,95 M178,100 L190,15 L212,95 M222,100 L245,25 L232,105 M242,110 L275,35 L232,100" stroke="#121316" stroke-width="7.5" fill="${palette.secondary}" stroke-linejoin="round" />
      ` : isHarpy ? `
        <!-- Double Horn Crest -->
        <polygon points="145,110 125,35 172,95" fill="#121316" stroke="#121316" stroke-width="6.5" />
        <polygon points="255,110 275,35 228,95" fill="#121316" stroke="#121316" stroke-width="6.5" />
      ` : isHornbill ? `
        <!-- Massive Golden Hornbill Helmet / Casque -->
        <path d="M165,115 Q200,30 255,85 L200,145 Z" fill="#FFDD33" stroke="#121316" stroke-width="7" stroke-linejoin="round" />
        <circle cx="215" cy="85" r="8" fill="#F4002C" />
      ` : isCrane ? `
        <!-- Crimson Red Crown -->
        <ellipse cx="200" cy="112" rx="38" ry="18" fill="#F4002C" stroke="#121316" stroke-width="5.5" />
      ` : `
        <!-- Playful Top Feather Tufts -->
        <path d="M178,105 Q200,25 222,105" fill="${palette.secondary}" stroke="#121316" stroke-width="7.5" />
      `}

      <!-- Bird Head / Body -->
      <circle cx="200" cy="190" r="${isKakapo || isKiwi ? 92 : 88}" fill="${birdColor}" stroke="#121316" stroke-width="8" />

      <!-- Owl Face Mask (Kakapo) / Blue Eye Patch (Bali Myna) -->
      ${isKakapo ? `
        <ellipse cx="152" cy="170" rx="32" ry="32" fill="#FFEAA7" stroke="#121316" stroke-width="5.5" />
        <ellipse cx="248" cy="170" rx="32" ry="32" fill="#FFEAA7" stroke="#121316" stroke-width="5.5" />
      ` : isMyna ? `
        <ellipse cx="142" cy="170" rx="26" ry="18" fill="#18D7E8" stroke="#121316" stroke-width="4.5" />
        <ellipse cx="258" cy="170" rx="26" ry="18" fill="#18D7E8" stroke="#121316" stroke-width="4.5" />
      ` : ''}

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 165 }, { cx: 252, cy: 165 }, isPhilippineEagle ? '#18D7E8' : '#FFDD33')}

      <!-- Beaks -->
      ${isShoebill ? `
        <!-- Massive Wooden Shoe Clog Bill with Rivets -->
        <path d="M162,180 Q200,162 238,180 L228,265 Q200,292 172,265 Z" fill="#FFDD33" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <line x1="200" y1="180" x2="200" y2="280" stroke="#121316" stroke-width="6.5" />
        <circle cx="200" cy="275" r="7" fill="#F4002C" />
      ` : isKiwi ? `
        <!-- Long Slender Probe Beak -->
        <path d="M194,190 L184,290 L206,190" fill="#FFEAA7" stroke="#121316" stroke-width="6.5" stroke-linejoin="round" />
      ` : `
        <!-- Hooked Raptor / Parrot Beak -->
        <polygon points="172,185 228,185 200,248" fill="#FFDD33" stroke="#121316" stroke-width="7.5" stroke-linejoin="round" />
        <line x1="172" y1="185" x2="228" y2="185" stroke="#121316" stroke-width="6" />
      `}
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. REPTILES & AMPHIBIANS
  // ═════════════════════════════════════════════════════════════════════════════

  // Axolotl
  if (slug.includes('axolotl')) {
    return `
      <!-- Feathery Branching Pink Gills with Glow Bulbs -->
      <g class="ear-anim">
        <path d="M110,138 Q45,105 65,158 Q38,180 110,180" fill="#FEB3FC" stroke="#121316" stroke-width="7.5" />
        <circle cx="62" cy="110" r="9" fill="#F4002C" />
        <circle cx="40" cy="152" r="9" fill="#F4002C" />
        <circle cx="52" cy="186" r="9" fill="#F4002C" />

        <path d="M290,138 Q355,105 335,158 Q362,180 290,180" fill="#FEB3FC" stroke="#121316" stroke-width="7.5" />
        <circle cx="338" cy="110" r="9" fill="#F4002C" />
        <circle cx="360" cy="152" r="9" fill="#F4002C" />
        <circle cx="348" cy="186" r="9" fill="#F4002C" />
      </g>

      <!-- Head with Translucent Glow -->
      <ellipse cx="200" cy="195" rx="94" ry="78" fill="#FEB3FC" stroke="#121316" stroke-width="8" />

      <!-- Eyes (Liquid Sparkle by default for Axolotl) -->
      ${renderEyes(mood === 'happy' ? 'kawaii' : mood, { cx: 148, cy: 178 }, { cx: 252, cy: 178 })}

      <!-- Rosy Cheeks -->
      <ellipse cx="125" cy="210" rx="16" ry="10" fill="#F4002C" opacity="0.6" />
      <ellipse cx="275" cy="210" rx="16" ry="10" fill="#F4002C" opacity="0.6" />

      <!-- Sweet Grin -->
      <path d="M182,216 Q200,238 218,216" stroke="#121316" stroke-width="6.5" fill="none" stroke-linecap="round" />
    `;
  }

  // Gharial & Crocodilians
  if (slug.includes('gharial') || slug.includes('crocodile')) {
    return `
      <!-- Reptile Head with Armor Ridges -->
      <ellipse cx="200" cy="205" rx="84" ry="78" fill="${palette.accent}" stroke="#121316" stroke-width="8" />

      <!-- Long Slender Gharial Snout -->
      <polygon points="182,200 218,200 212,295 188,295" fill="${palette.secondary}" stroke="#121316" stroke-width="7.5" stroke-linejoin="round" />
      <!-- Bulbous Ghara Knob at Tip -->
      <circle cx="200" cy="295" r="16" fill="#FFDD33" stroke="#121316" stroke-width="6.5" />

      <!-- Interlocking Needle Teeth -->
      <line x1="180" y1="228" x2="188" y2="228" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
      <line x1="212" y1="228" x2="220" y2="228" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
      <line x1="182" y1="260" x2="190" y2="260" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
      <line x1="210" y1="260" x2="218" y2="260" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />

      <!-- Perched Reptile Slit Eyes -->
      <circle cx="152" cy="165" r="19" fill="#FFDD33" stroke="#121316" stroke-width="6.5" />
      <ellipse cx="152" cy="165" rx="4.5" ry="15" fill="#121316" />
      <circle cx="248" cy="165" r="19" fill="#FFDD33" stroke="#121316" stroke-width="6.5" />
      <ellipse cx="248" cy="165" rx="4.5" ry="15" fill="#121316" />
    `;
  }

  // Komodo Dragon, Frogs, Salamanders, Iguana, Tortoises
  if (slug.includes('komodo') || slug.includes('frog') || slug.includes('salamander') || slug.includes('iguana') || slug.includes('tortoise')) {
    const isKomodo = slug.includes('komodo');
    const isCorroboree = slug.includes('corroboree');
    const isGoldenFrog = slug.includes('golden_frog');
    const isIguana = slug.includes('iguana');
    const isTortoise = slug.includes('tortoise');

    return `
      <!-- Iguana Spiky Crest -->
      ${isIguana ? `
        <polygon points="200,55 188,110 212,110" fill="#9EFC5F" stroke="#121316" stroke-width="5.5" />
        <polygon points="172,70 168,120 185,120" fill="#9EFC5F" stroke="#121316" stroke-width="5.5" />
        <polygon points="228,70 215,120 232,120" fill="#9EFC5F" stroke="#121316" stroke-width="5.5" />
      ` : ''}

      <!-- Main Head -->
      <ellipse cx="200" cy="195" rx="94" ry="${isTortoise ? 98 : 84}" fill="${isGoldenFrog ? '#FFDD33' : isCorroboree ? '#121316' : palette.accent}" stroke="#121316" stroke-width="8" />

      <!-- Corroboree Frog Electric Racing Stripes -->
      ${isCorroboree ? `
        <path d="M145,130 Q135,195 145,265 M200,118 Q200,195 200,275 M255,130 Q265,195 255,265" stroke="#FFDD33" stroke-width="14" fill="none" stroke-linecap="round" />
      ` : ''}

      <!-- Radiated Tortoise Starburst Shell -->
      ${isTortoise ? `
        <polygon points="200,155 218,185 248,185 222,202 232,235 200,218 168,235 178,202 152,185 182,185" fill="#FFDD33" stroke="#121316" stroke-width="5.5" />
      ` : ''}

      <!-- Eyes -->
      ${renderEyes(mood, { cx: 148, cy: 168 }, { cx: 252, cy: 168 }, isKomodo ? '#FFDD33' : '#18D7E8')}

      <!-- Forked Tongue Flick (Komodo) / Happy Gummy Smile -->
      ${isKomodo ? `
        <path class="tongue-anim" d="M200,228 L200,272 L182,288 M200,272 L218,288" stroke="#FFDD33" stroke-width="8" fill="none" stroke-linecap="round" />
      ` : `
        <path d="M162,225 Q200,258 238,225" stroke="#121316" stroke-width="6.5" fill="#F4002C" stroke-linecap="round" />
      `}
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. INVERTEBRATES & FLORA
  // ═════════════════════════════════════════════════════════════════════════════

  // Monarch Butterfly & Insects (Bee, Stick Insect, Tarantula)
  if (slug.includes('butterfly') || slug.includes('bee') || slug.includes('insect') || slug.includes('tarantula')) {
    const isButterfly = slug.includes('butterfly');
    const isTarantula = slug.includes('tarantula');
    const isBee = slug.includes('bee');

    if (isButterfly) {
      return `
        <!-- Stained Glass Monarch Wings with Gradient Fill -->
        <g class="wing-anim">
          <ellipse cx="115" cy="158" rx="74" ry="58" fill="#FE4E1A" stroke="#121316" stroke-width="8" />
          <ellipse cx="285" cy="158" rx="74" ry="58" fill="#FE4E1A" stroke="#121316" stroke-width="8" />
          <ellipse cx="125" cy="238" rx="58" ry="42" fill="#FE4E1A" stroke="#121316" stroke-width="7.5" />
          <ellipse cx="275" cy="238" rx="58" ry="42" fill="#FE4E1A" stroke="#121316" stroke-width="7.5" />
          <!-- Wing Veins & Pearl Dots -->
          <path d="M115,158 L65,128 M115,158 L52,168 M285,158 L335,128 M285,158 L348,168" stroke="#121316" stroke-width="5.5" />
          <circle cx="58" cy="138" r="4.5" fill="#FFFFFF" />
          <circle cx="342" cy="138" r="4.5" fill="#FFFFFF" />
          <circle cx="68" cy="245" r="4" fill="#FFFFFF" />
          <circle cx="332" cy="245" r="4" fill="#FFFFFF" />
        </g>
        <!-- Antennae -->
        <path d="M188,138 Q168,65 135,75 M212,138 Q232,65 265,75" stroke="#121316" stroke-width="6.5" fill="none" stroke-linecap="round" />
        <!-- Butterfly Slender Body -->
        <ellipse cx="200" cy="200" rx="22" ry="74" fill="#121316" stroke="#FFFFFF" stroke-width="3.5" />
        ${renderEyes(mood, { cx: 194, cy: 160 }, { cx: 206, cy: 160 })}
      `;
    }

    if (isTarantula) {
      return `
        <!-- Cobalt Blue Iridescent Spider Legs -->
        <path d="M148,170 Q65,115 45,180 M148,190 Q55,180 35,220 M148,210 Q65,245 55,285" stroke="#18D7E8" stroke-width="9.5" fill="none" stroke-linecap="round" />
        <path d="M252,170 Q335,115 355,180 M252,190 Q345,180 365,220 M252,210 Q335,245 345,285" stroke="#18D7E8" stroke-width="9.5" fill="none" stroke-linecap="round" />
        <!-- Cephalothorax & Abdomen -->
        <ellipse cx="200" cy="228" rx="58" ry="64" fill="#4717AE" stroke="#121316" stroke-width="8" />
        <ellipse cx="200" cy="165" rx="44" ry="40" fill="#18D7E8" stroke="#121316" stroke-width="7.5" />
        <!-- 8 Sparkle Spider Eyes -->
        <circle cx="185" cy="155" r="5.5" fill="#FFDD33" />
        <circle cx="200" cy="150" r="6.5" fill="#FFDD33" />
        <circle cx="215" cy="155" r="5.5" fill="#FFDD33" />
        <circle cx="190" cy="168" r="4.5" fill="#FFDD33" />
        <circle cx="210" cy="168" r="4.5" fill="#FFDD33" />
      `;
    }

    // Wallace's Giant Bee
    return `
      <!-- Antennae -->
      <path d="M172,118 Q135,45 105,60 M228,118 Q265,45 295,60" stroke="#121316" stroke-width="7.5" fill="none" stroke-linecap="round" />
      <circle cx="105" cy="60" r="11" fill="#FFDD33" stroke="#121316" stroke-width="4.5" />
      <circle cx="295" cy="60" r="11" fill="#FFDD33" stroke="#121316" stroke-width="4.5" />
      <!-- Round Head & Jaws -->
      <path d="M162,225 Q135,288 178,288 M238,225 Q265,288 222,288" stroke="#121316" stroke-width="9.5" fill="none" stroke-linecap="round" />
      <ellipse cx="200" cy="185" rx="84" ry="78" fill="${isBee ? '#FFDD33' : '#9EFC5F'}" stroke="#121316" stroke-width="8" />
      <!-- Big Compound Eyes -->
      <ellipse cx="142" cy="170" rx="24" ry="32" fill="#121316" stroke="#FFFFFF" stroke-width="3.5" />
      <ellipse cx="258" cy="170" rx="24" ry="32" fill="#121316" stroke="#FFFFFF" stroke-width="3.5" />
      <circle cx="146" cy="162" r="5" fill="#18D7E8" />
      <circle cx="262" cy="162" r="5" fill="#18D7E8" />
    `;
  }

  // Flora (Dragon Blood Tree, Baobab, Wollemi Pine, Titan Arum, Ghost Orchid)
  if (slug.includes('tree') || slug.includes('baobab') || slug.includes('pine') || slug.includes('arum') || slug.includes('orchid')) {
    const isTitanArum = slug.includes('arum');
    const isOrchid = slug.includes('orchid');
    const isBaobab = slug.includes('baobab');
    const isDragon = slug.includes('dragon');

    if (isTitanArum) {
      return `
        <!-- Titan Arum Spathe & Spadix -->
        <polygon points="125,265 200,95 275,265" fill="#F4002C" stroke="#121316" stroke-width="8" stroke-linejoin="round" />
        <polygon points="178,245 200,45 222,245" fill="#9EFC5F" stroke="#121316" stroke-width="7.5" stroke-linejoin="round" />
        ${renderEyes(mood, { cx: 168, cy: 210 }, { cx: 232, cy: 210 })}
        <path d="M188,232 Q200,244 212,232" stroke="#FFFFFF" stroke-width="4.5" fill="none" stroke-linecap="round" />
      `;
    }

    if (isOrchid) {
      return `
        <!-- Ethereal Ghost Orchid Blossom -->
        <g class="wing-anim">
          <ellipse cx="200" cy="125" rx="22" ry="48" fill="#FFFFFF" stroke="#121316" stroke-width="6.5" />
          <ellipse cx="135" cy="185" rx="48" ry="22" fill="#FFFFFF" stroke="#121316" stroke-width="6.5" transform="rotate(-30 135 185)" />
          <ellipse cx="265" cy="185" rx="48" ry="22" fill="#FFFFFF" stroke="#121316" stroke-width="6.5" transform="rotate(30 265 185)" />
        </g>
        <!-- Center Mascot Face -->
        <circle cx="200" cy="190" r="30" fill="#9EFC5F" stroke="#121316" stroke-width="6.5" />
        ${renderEyes(mood, { cx: 192, cy: 185 }, { cx: 208, cy: 185 })}
      `;
    }

    // Baobab / Dragon Blood Tree
    return `
      <!-- Trunk -->
      <rect x="${isBaobab ? 140 : 168}" y="165" width="${isBaobab ? 120 : 64}" height="115" rx="18" fill="#FE4E1A" stroke="#121316" stroke-width="8" />
      <!-- Forest Canopy -->
      <ellipse cx="200" cy="135" rx="${isDragon ? 125 : 105}" ry="${isDragon ? 54 : 74}" fill="#9EFC5F" stroke="#121316" stroke-width="8" />
      <!-- Mascot Face -->
      ${renderEyes(mood, { cx: 178, cy: 218 }, { cx: 222, cy: 218 })}
      <path d="M188,245 Q200,256 212,245" stroke="#121316" stroke-width="5.5" fill="none" stroke-linecap="round" />
    `;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // DEFAULT / UNIVERSAL ADORABLE MASCOT
  // ═════════════════════════════════════════════════════════════════════════════
  return `
    <!-- Antennae / Leaves -->
    <path d="M158,105 Q135,45 105,60" stroke="#121316" stroke-width="7.5" fill="none" stroke-linecap="round" />
    <circle cx="105" cy="60" r="13" fill="${palette.secondary}" stroke="#121316" stroke-width="5.5" />
    <path d="M242,105 Q265,45 295,60" stroke="#121316" stroke-width="7.5" fill="none" stroke-linecap="round" />
    <circle cx="295" cy="60" r="13" fill="${palette.secondary}" stroke="#121316" stroke-width="5.5" />

    <!-- Round Character Head with Rim Highlight -->
    <circle cx="200" cy="200" r="88" fill="${palette.accent}" stroke="#121316" stroke-width="8" />
    <path d="M130,225 Q200,270 270,225" stroke="#FFFFFF" stroke-width="5" fill="none" opacity="0.4" />

    <!-- Eyes -->
    ${renderEyes(mood, { cx: 155, cy: 172 }, { cx: 245, cy: 172 })}

    <!-- Happy Smile & Cheeks -->
    <ellipse cx="130" cy="195" rx="14" ry="8" fill="#F4002C" opacity="0.4" />
    <ellipse cx="270" cy="195" rx="14" ry="8" fill="#F4002C" opacity="0.4" />
    <path d="M168,225 Q200,262 232,225" stroke="#121316" stroke-width="6.5" fill="#FFDD33" stroke-linecap="round" />
  `;
}

/**
 * Generates an expressive, lively, animated GIPHY-style SVG Profile Avatar.
 *
 * @param {Object} species
 * @param {string} species.slug - Unique slug of the species
 * @param {string} [species.commonName] - Display common name
 * @param {string} [species.taxonomicGroup] - Taxonomic group
 * @param {Object} [options]
 * @param {string} [options.shape='badge'] - 'badge' (framed badge) or 'circle' (round profile photo sticker)
 * @param {boolean} [options.animated=true] - Whether to include embedded CSS keyframes
 * @param {string} [options.accessory] - 'shades' | 'party' | 'headphones' | 'crown' | 'boba' | 'explorer' | 'flower' | 'monocle' | 'none'
 * @param {string} [options.mood] - 'happy' | 'cool' | 'excited' | 'kawaii' | 'curious' | 'zen'
 * @param {string} [options.seed] - Seed string (e.g. username) for deterministic personalization
 * @returns {string} Clean SVG XML
 */
function generateFunAnimalSvg(species, options = {}) {
  const slug = (species?.slug || 'animal').toLowerCase();
  const name = species?.commonName || 'Explorer';
  const palette = getPaletteForSlug(slug);
  const shape = options.shape || 'badge';
  const animated = options.animated !== false;

  // Resolve deterministic personalization if no explicit accessory or mood provided
  const seed = options.seed || species?.username || '';
  const flair = getDeterministicFlair(slug, seed);
  const accessory = options.accessory !== undefined ? options.accessory : (seed ? flair.accessory : 'none');
  const mood = options.mood !== undefined ? options.mood : (seed ? flair.mood : 'happy');

  const animationStyles = getGiphyAnimationStyles(animated);
  const faceArt = getSpeciesCharacterSvg(slug, palette, mood);
  const accessoryArt = renderAccessory(accessory, palette);

  if (shape === 'circle') {
    // Pure Circular Profile Photo Sticker
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <filter id="neoShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#121316" />
    </filter>
  </defs>
  ${animationStyles}

  <!-- Outer White Sticker Border & Circular Base -->
  <circle cx="200" cy="200" r="185" fill="${palette.bg}" stroke="#121316" stroke-width="8" filter="url(#neoShadow)" />

  <!-- Doodles / Sparkles -->
  <polygon class="star-1" points="65,65 70,80 85,80 73,90 77,105 65,95 53,105 57,90 45,80 60,80" fill="#FFDD33" stroke="#121316" stroke-width="3.5" />
  <circle class="star-2" cx="335" cy="75" r="13" fill="${palette.secondary}" stroke="#121316" stroke-width="4.5" />
  <polygon class="star-3" points="330,310 335,322 347,322 337,330 340,342 330,334 320,342 323,330 313,322 325,322" fill="#18D7E8" stroke="#121316" stroke-width="3.5" />

  <!-- Center Character Art with Float Animation -->
  <g class="giphy-char">
    ${faceArt}
    ${accessoryArt}
  </g>
</svg>`;
  }

  // Default: Neo-brutalist Framed Badge with Bottom Label
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <filter id="neoShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="8" dy="8" stdDeviation="0" flood-color="#121316" />
    </filter>
  </defs>
  ${animationStyles}

  <!-- Background Base Canvas -->
  <rect x="15" y="15" width="370" height="370" rx="36" fill="${palette.bg}" stroke="#121316" stroke-width="8" filter="url(#neoShadow)" />

  <!-- Background Doodles / Neo-Brutalist Dots & Stars -->
  <circle class="star-1" cx="65" cy="65" r="11" fill="${palette.accent}" stroke="#121316" stroke-width="3.5" />
  <circle class="star-2" cx="335" cy="75" r="15" fill="${palette.secondary}" stroke="#121316" stroke-width="4.5" />
  <polygon class="star-3" points="340,290 345,305 360,305 348,315 352,330 340,320 328,330 332,315 320,305 335,305" fill="#FFDD33" stroke="#121316" stroke-width="3.5" />
  <polygon class="star-1" points="60,290 65,302 77,302 67,310 70,322 60,314 50,322 53,310 43,302 55,302" fill="#18D7E8" stroke="#121316" stroke-width="3.5" />

  <!-- Center Character Art with Float Animation -->
  <g class="giphy-char">
    ${faceArt}
    ${accessoryArt}
  </g>

  <!-- Bottom Name Banner with Poppins Typography -->
  <rect x="36" y="325" width="328" height="44" rx="12" fill="#FFFFFF" stroke="#121316" stroke-width="5.5" />
  <text x="200" y="353" font-family="'Poppins', sans-serif" font-weight="900" font-size="14" fill="#121316" text-anchor="middle" letter-spacing="1">
    ${name.toUpperCase().slice(0, 24)}
  </text>
</svg>`;
}

/**
 * Returns a Data URI string for the animated SVG avatar.
 */
function getFunAnimalDataUri(species, options = {}) {
  const svg = generateFunAnimalSvg(species, options);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

module.exports = {
  generateFunAnimalSvg,
  getFunAnimalDataUri,
  getPaletteForSlug,
  getDeterministicFlair,
  PALETTES,
};
