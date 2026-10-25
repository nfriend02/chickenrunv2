export const GameStateEnum = {
  TITLE: 'TITLE',
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  STAGE_CLEAR: 'STAGE_CLEAR',
  GAME_OVER: 'GAME_OVER'
};

export const ViewMode = {
  LANDSCAPE: 'LANDSCAPE',
  PORTRAIT: 'PORTRAIT'
};

export const Characters = [
  {
    id: 'funny_chicken',
    name: 'Funny Chicken',
    title: 'All-rounder / Standard (Hero)',
    speed: 3,
    jumpPower: 3,
    hitboxRadius: 0.7,
    magnetRadius: 3.0,
    skill: 'Somersault Guard',
    skillDesc: 'Ignores every obstacle while jumping (somersault)',
    color: 0xFFE082,
    combColor: 0xE53935,
    beakColor: 0xFFA000,
    imagePath: '/assets/images/characters/funny_chicken.png'
  },
  {
    id: 'rooster_king',
    name: 'Rooster King',
    title: 'Heavy power / Breaker',
    speed: 2,
    jumpPower: 2,
    hitboxRadius: 0.9,
    magnetRadius: 4.0,
    skill: 'Heavy Break',
    skillDesc: 'Once per run, smashes an obstacle without losing a feather',
    color: 0x8D6E63,
    combColor: 0xC62828,
    beakColor: 0xFF8F00,
    imagePath: '/assets/images/characters/rooster_king.png'
  },
  {
    id: 'speedy_chick',
    name: 'Speedy Chick',
    title: 'Super fast / Small dodger',
    speed: 5,
    jumpPower: 5,
    hitboxRadius: 0.45,
    magnetRadius: 2.2,
    skill: 'Feather Dash',
    skillDesc: 'Passive +15% move speed and slips through narrow gaps',
    color: 0xFFEB3B,
    combColor: 0xFF9800,
    beakColor: 0xFF6F00,
    imagePath: '/assets/images/characters/speedy_chick.png'
  },
  {
    id: 'daffy_duck',
    name: 'Daffy Duck',
    title: 'Amphibious / Flexible',
    speed: 4,
    jumpPower: 3,
    hitboxRadius: 0.7,
    magnetRadius: 3.0,
    skill: 'Water Glide',
    skillDesc: 'No slowdown on ponds and slippery ground, +20% speed there',
    color: 0xFFFFFF,
    combColor: 0x4CAF50,
    beakColor: 0xFF9800,
    imagePath: '/assets/images/characters/daffy_duck.png'
  },
  {
    id: 'turbo_turkey',
    name: 'Turbo Turkey',
    title: 'Frenzy boost / Rager',
    speed: 3,
    jumpPower: 4,
    hitboxRadius: 0.85,
    magnetRadius: 4.5,
    skill: 'Rage Booster',
    skillDesc: 'When hit, rages for 3 seconds: invincible high-speed dash',
    color: 0x5D4037,
    combColor: 0xD32F2F,
    beakColor: 0xFFB300,
    imagePath: '/assets/images/characters/turbo_turkey.png'
  }
];

export const Stages = [
  {
    id: 1,
    name: 'Stage 1: Farm Yard',
    difficulty: '★☆☆☆☆',
    baseSpeed: 12.0,
    speedMultiplier: 1.0,
    duration: 90, // seconds
    bgColor: 0xD2B48C,
    skyColor: 0x87CEEB,
    groundColor: 0x8D6E63,
    bgImage: '/assets/images/backgrounds/stage01.png',
    theme: 'Warm sunshine & gravel path',
    obstacles: ['haystack', 'fence', 'dog', 'duck', 'pond'],
    obstacleWeights: { haystack: 3, fence: 2, dog: 2, duck: 2, pond: 1 },
    world: {
      dir: '/assets/stages/stage01',
      curviness: 1.0,
      hilliness: 0.8,
      roadHalfWidth: 2.2,
      // Billboard height and lateral offset from road center, in world units.
      props: {
        apple_tree: { height: 5.2, minOffset: 5.0, maxOffset: 13, weight: 3 },
        fence_section: { height: 1.2, minOffset: 3.4, maxOffset: 4.0, weight: 3 },
        hay_stack: { height: 1.7, minOffset: 3.8, maxOffset: 8, weight: 2 },
        barrels: { height: 1.4, minOffset: 3.6, maxOffset: 7, weight: 1.5 },
        barn: { height: 6.5, minOffset: 9, maxOffset: 15, weight: 0.6 },
        duck_pond: { height: 1.8, minOffset: 5.5, maxOffset: 11, weight: 0.8 }
      }
    },
    bossEvent: 'The cat gets buried in a haystack',
    bossImage: '/assets/images/npcs/cat_grumpy.png'
  },
  {
    id: 2,
    name: 'Stage 2: Fenced Meadow',
    difficulty: '★★☆☆☆',
    baseSpeed: 14.4,
    speedMultiplier: 1.2,
    duration: 95,
    bgColor: 0x50C878,
    skyColor: 0x64B5F6,
    groundColor: 0x4E342E,
    bgImage: '/assets/images/backgrounds/stage02.png',
    world: { dir: '/assets/stages/stage02' },
    theme: 'Wide open green pasture',
    obstacles: ['fence', 'cow_rushing', 'rock'],
    bossEvent: 'The old cat charges across the meadow',
    bossImage: '/assets/images/npcs/cat_grumpy.png'
  },
  {
    id: 3,
    name: 'Stage 3: Rustic Farmhouse',
    difficulty: '★★★☆☆',
    baseSpeed: 15.6,
    speedMultiplier: 1.3,
    duration: 100,
    bgColor: 0x3B2F2F,
    skyColor: 0x212121,
    groundColor: 0xD7CCC8,
    bgImage: '/assets/images/backgrounds/stage03.png',
    world: { dir: '/assets/stages/stage03' },
    theme: 'Retro floor mats & wooden floors',
    obstacles: ['door_sill', 'tea_spill', 'pestle'],
    bossEvent: 'The cat rolls into a silk quilt',
    bossImage: '/assets/images/npcs/cat_quilt.png'
  },
  {
    id: 4,
    name: 'Stage 4: Mountain Dirt Road',
    difficulty: '★★★★☆',
    baseSpeed: 18.0,
    speedMultiplier: 1.5,
    duration: 110,
    bgColor: 0xFF4500,
    skyColor: 0xE65100,
    groundColor: 0x5D4037,
    bgImage: '/assets/images/backgrounds/stage04.png',
    world: { dir: '/assets/stages/stage04' },
    theme: 'Sunset mountain path & cliffs',
    obstacles: ['rock', 'old_car', 'cliff_hole'],
    bossEvent: 'The rope bridge snaps and the cat gets stuck in a tree',
    bossImage: '/assets/images/npcs/cat_unicycle.png'
  },
  {
    id: 5,
    name: 'Stage 5: Rural 5-Day Market',
    difficulty: '★★★★★',
    baseSpeed: 19.2,
    speedMultiplier: 1.6,
    duration: 120,
    bgColor: 0xE53935,
    skyColor: 0x1E88E5,
    groundColor: 0xBDBDBD,
    bgImage: '/assets/images/backgrounds/stage05.png',
    world: { dir: '/assets/stages/stage05' },
    theme: 'Bustling popcorn market',
    obstacles: ['apple_box', 'cart', 'market_crowd'],
    bossEvent: 'The popcorn machine explodes and the cats fly away!',
    bossImage: '/assets/images/fixtures/popcorn_machine.png'
  }
];

export const ItemTypes = {
  RICE: { id: 'rice', name: 'Rice', score: 10, feverInc: 4, color: 0xFFFFFF, image: '/assets/images/items/item_rice.png' },
  CORN: { id: 'corn', name: 'Corn', score: 20, feverInc: 8, color: 0xFFD700, image: '/assets/images/items/item_corn.png' },
  PEPPER: { id: 'pepper', name: 'Hot Pepper', score: 100, feverInc: 25, duration: 4.0, power: 'FIRE_BOOST', color: 0xFF1744, image: '/assets/images/items/item_pepper.png' },
  BANANA: { id: 'banana', name: 'Golden Banana', score: 100, feverInc: 25, duration: 8.0, power: 'DOUBLE_JUMP', color: 0xFFEA00, image: '/assets/images/items/item_banana.png' },
  MAGNET: { id: 'magnet', name: 'Magnet Seed', score: 100, feverInc: 25, duration: 6.0, power: 'MAGNET_PULL', color: 0x2979FF, image: '/assets/images/items/item_magnet.png' }
};
