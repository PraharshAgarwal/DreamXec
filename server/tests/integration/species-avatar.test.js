const {
  generateFunAnimalSvg,
  getFunAnimalDataUri,
  getPaletteForSlug,
  PALETTES,
} = require('../../src/modules/species/services/species-avatar.service');

describe('GIPHY-Style Endangered Species Profile Avatar Generator', () => {
  const REQUESTED_SPECIES_LIST = [
    // Mammals
    { slug: 'vaquita', commonName: 'Vaquita', taxonomicGroup: 'MAMMAL' },
    { slug: 'javan_rhino', commonName: 'Javan Rhino', taxonomicGroup: 'MAMMAL' },
    { slug: 'saola', commonName: 'Saola', taxonomicGroup: 'MAMMAL' },
    { slug: 'amur_leopard', commonName: 'Amur Leopard', taxonomicGroup: 'MAMMAL' },
    { slug: 'sumatran_rhino', commonName: 'Sumatran Rhino', taxonomicGroup: 'MAMMAL' },
    { slug: 'mountain_gorilla', commonName: 'Mountain Gorilla', taxonomicGroup: 'MAMMAL' },
    { slug: 'cross_river_gorilla', commonName: 'Cross River Gorilla', taxonomicGroup: 'MAMMAL' },
    { slug: 'tapanuli_orangutan', commonName: 'Tapanuli Orangutan', taxonomicGroup: 'MAMMAL' },
    { slug: 'snow_leopard', commonName: 'Snow Leopard', taxonomicGroup: 'MAMMAL' },
    { slug: 'cheetah', commonName: 'Cheetah', taxonomicGroup: 'MAMMAL' },
    { slug: 'red_panda', commonName: 'Red Panda', taxonomicGroup: 'MAMMAL' },
    { slug: 'iberian_lynx', commonName: 'Iberian Lynx', taxonomicGroup: 'MAMMAL' },
    { slug: 'polar_bear', commonName: 'Polar Bear', taxonomicGroup: 'MAMMAL' },
    { slug: 'koala', commonName: 'Koala', taxonomicGroup: 'MAMMAL' },
    { slug: 'bonobo', commonName: 'Bonobo', taxonomicGroup: 'MAMMAL' },
    { slug: 'pygmy_hippo', commonName: 'Pygmy Hippo', taxonomicGroup: 'MAMMAL' },

    // Marine & Aquatic
    { slug: 'blue_whale', commonName: 'Blue Whale', taxonomicGroup: 'MARINE' },
    { slug: 'north_atlantic_right_whale', commonName: 'Right Whale', taxonomicGroup: 'MARINE' },
    { slug: 'yangtze_finless_porpoise', commonName: 'Yangtze Porpoise', taxonomicGroup: 'MARINE' },
    { slug: 'amazon_river_dolphin', commonName: 'Amazon Boto Dolphin', taxonomicGroup: 'MARINE' },
    { slug: 'hawksbill_turtle', commonName: 'Hawksbill Turtle', taxonomicGroup: 'MARINE' },
    { slug: 'leatherback_turtle', commonName: 'Leatherback Turtle', taxonomicGroup: 'MARINE' },
    { slug: 'whale_shark', commonName: 'Whale Shark', taxonomicGroup: 'MARINE' },
    { slug: 'great_hammerhead', commonName: 'Great Hammerhead', taxonomicGroup: 'MARINE' },
    { slug: 'giant_manta_ray', commonName: 'Giant Manta Ray', taxonomicGroup: 'MARINE' },
    { slug: 'dugong', commonName: 'Dugong', taxonomicGroup: 'MARINE' },
    { slug: 'coelacanth', commonName: 'Coelacanth', taxonomicGroup: 'MARINE' },
    { slug: 'smalltooth_sawfish', commonName: 'Smalltooth Sawfish', taxonomicGroup: 'MARINE' },

    // Birds
    { slug: 'kakapo', commonName: 'Kakapo', taxonomicGroup: 'BIRDS' },
    { slug: 'philippine_eagle', commonName: 'Philippine Eagle', taxonomicGroup: 'BIRDS' },
    { slug: 'spixs_macaw', commonName: "Spix's Macaw", taxonomicGroup: 'BIRDS' },
    { slug: 'california_condor', commonName: 'California Condor', taxonomicGroup: 'BIRDS' },
    { slug: 'spoon_billed_sandpiper', commonName: 'Spoon-billed Sandpiper', taxonomicGroup: 'BIRDS' },
    { slug: 'whooping_crane', commonName: 'Whooping Crane', taxonomicGroup: 'BIRDS' },
    { slug: 'great_indian_bustard', commonName: 'Great Indian Bustard', taxonomicGroup: 'BIRDS' },
    { slug: 'bali_myna', commonName: 'Bali Myna', taxonomicGroup: 'BIRDS' },
    { slug: 'shoebill', commonName: 'Shoebill', taxonomicGroup: 'BIRDS' },
    { slug: 'harpy_eagle', commonName: 'Harpy Eagle', taxonomicGroup: 'BIRDS' },
    { slug: 'brown_kiwi', commonName: 'Kiwi', taxonomicGroup: 'BIRDS' },

    // Reptiles & Amphibians
    { slug: 'axolotl', commonName: 'Axolotl', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'gharial', commonName: 'Gharial', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'komodo_dragon', commonName: 'Komodo Dragon', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'panamanian_golden_frog', commonName: 'Panamanian Golden Frog', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'chinese_giant_salamander', commonName: 'Chinese Giant Salamander', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'ploughshare_tortoise', commonName: 'Ploughshare Tortoise', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'radiated_tortoise', commonName: 'Radiated Tortoise', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'fiji_crested_iguana', commonName: 'Fiji Crested Iguana', taxonomicGroup: 'REPTILES_AMPHIBIANS' },
    { slug: 'corroboree_frog', commonName: 'Corroboree Frog', taxonomicGroup: 'REPTILES_AMPHIBIANS' },

    // Invertebrates & Flora
    { slug: 'lord_howe_stick_insect', commonName: 'Lord Howe Stick Insect', taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'monarch_butterfly', commonName: 'Monarch Butterfly', taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'wallaces_giant_bee', commonName: "Wallace's Giant Bee", taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'peacock_tarantula', commonName: 'Peacock Tarantula', taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'dragon_blood_tree', commonName: 'Dragon Blood Tree', taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'grandidiers_baobab', commonName: "Grandidier's Baobab", taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'wollemi_pine', commonName: 'Wollemi Pine', taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'titan_arum', commonName: 'Titan Arum', taxonomicGroup: 'PLANTS_INVERTEBRATES' },
    { slug: 'ghost_orchid', commonName: 'Ghost Orchid', taxonomicGroup: 'PLANTS_INVERTEBRATES' },
  ];

  describe('Deterministic Palette Selector', () => {
    it('returns a consistent palette for the same slug', () => {
      const palette1 = getPaletteForSlug('vaquita');
      const palette2 = getPaletteForSlug('vaquita');
      expect(palette1).toEqual(palette2);
      expect(PALETTES).toContainEqual(palette1);
    });

    it('handles empty or missing slug gracefully', () => {
      const palette = getPaletteForSlug();
      expect(palette).toBeDefined();
      expect(palette.bg).toBeDefined();
    });
  });

  describe('GIPHY Embedded Animations & Badge Formatting', () => {
    it('includes CSS keyframes when animated is true', () => {
      const svg = generateFunAnimalSvg(
        { slug: 'vaquita', commonName: 'Vaquita' },
        { animated: true }
      );
      expect(svg).toContain('@keyframes giphyFloat');
      expect(svg).toContain('@keyframes eyeBlink');
      expect(svg).toContain('@keyframes starTwinkle');
      expect(svg).toContain('class="giphy-char"');
      expect(svg).toContain('class="eye-anim"');
    });

    it('omits CSS animation styles when animated is false', () => {
      const svg = generateFunAnimalSvg(
        { slug: 'vaquita', commonName: 'Vaquita' },
        { animated: false }
      );
      expect(svg).not.toContain('@keyframes giphyFloat');
    });

    it('generates a round sticker cutout when shape=circle', () => {
      const svg = generateFunAnimalSvg(
        { slug: 'amur_leopard', commonName: 'Amur Leopard' },
        { shape: 'circle' }
      );
      expect(svg).toContain('<circle cx="200" cy="200" r="185"');
      expect(svg).toContain('viewBox="0 0 400 400"');
    });

    it('generates a framed badge with bottom name banner when shape=badge', () => {
      const svg = generateFunAnimalSvg(
        { slug: 'axolotl', commonName: 'Axolotl' },
        { shape: 'badge' }
      );
      expect(svg).toContain('<rect x="15" y="15" width="370" height="370"');
      expect(svg).toContain('AXOLOTL');
      expect(svg).toContain("font-family=\"'Poppins', sans-serif\"");
    });
  });

  describe('Specific Visual Rendering for All 50+ Species', () => {
    test.each(REQUESTED_SPECIES_LIST)(
      'generates valid GIPHY SVG for $commonName ($slug)',
      (species) => {
        const svg = generateFunAnimalSvg(species, { animated: true });

        // Basic SVG structure assertions
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg.endsWith('</svg>')).toBe(true);
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('viewBox="0 0 400 400"');
        expect(svg.length).toBeGreaterThan(500);

        // Data URI generation
        const dataUri = getFunAnimalDataUri(species);
        expect(dataUri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
      }
    );
  });
});
