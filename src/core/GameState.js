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
    name: '젊은 암탉 (Funny Chicken)',
    title: '올라운더 / 기본형 (주인공)',
    speed: 3,
    jumpPower: 3,
    hitboxRadius: 0.7,
    magnetRadius: 3.0,
    skill: '공중제비 무적 가드 (Somersault Guard)',
    skillDesc: '점프(공중제비) 중 모든 장애물 충돌 완전 무시',
    color: 0xFFE082,
    combColor: 0xE53935,
    beakColor: 0xFFA000,
    imagePath: '/assets/images/characters/funny_chicken.png'
  },
  {
    id: 'rooster_king',
    name: '대형 수탉 (Rooster King)',
    title: '묵직한 파워 / 돌파형',
    speed: 2,
    jumpPower: 2,
    hitboxRadius: 0.9,
    magnetRadius: 4.0,
    skill: '묵직한 돌파 (Heavy Break)',
    skillDesc: '장애물 충돌 시 1회에 한해 깃털 차감 없이 장애물 파괴',
    color: 0x8D6E63,
    combColor: 0xC62828,
    beakColor: 0xFF8F00,
    imagePath: '/assets/images/characters/rooster_king.png'
  },
  {
    id: 'speedy_chick',
    name: '아기 병아리 (Speedy Chick)',
    title: '초고속 / 소형 회피형',
    speed: 5,
    jumpPower: 5,
    hitboxRadius: 0.45,
    magnetRadius: 2.2,
    skill: '깃털 대시 (Feather Dash)',
    skillDesc: '이동 속도 +15% 기본 패시브 및 좁은 틈새 통과',
    color: 0xFFEB3B,
    combColor: 0xFF9800,
    beakColor: 0xFF6F00,
    imagePath: '/assets/images/characters/speedy_chick.png'
  },
  {
    id: 'daffy_duck',
    name: '레이싱 오리 (Daffy Duck)',
    title: '수륙양용 / 유연형',
    speed: 4,
    jumpPower: 3,
    hitboxRadius: 0.7,
    magnetRadius: 3.0,
    skill: '수면 활주 (Water Glide)',
    skillDesc: '연못 및 미끄러운 바닥에서 감속 없이 속도 +20% 가속',
    color: 0xFFFFFF,
    combColor: 0x4CAF50,
    beakColor: 0xFF9800,
    imagePath: '/assets/images/characters/daffy_duck.png'
  },
  {
    id: 'turbo_turkey',
    name: '터보 칠면조 (Turbo Turkey)',
    title: '광란 가속 / 분노형',
    speed: 3,
    jumpPower: 4,
    hitboxRadius: 0.85,
    magnetRadius: 4.5,
    skill: '분노의 질주 (Rage Booster)',
    skillDesc: '피격 시 3초간 분노 상태로 무적 초고속 돌진',
    color: 0x5D4037,
    combColor: 0xD32F2F,
    beakColor: 0xFFB300,
    imagePath: '/assets/images/characters/turbo_turkey.png'
  }
];

export const Stages = [
  {
    id: 1,
    name: 'Stage 1: 농장 마당 (Farm Yard)',
    difficulty: '★☆☆☆☆',
    baseSpeed: 12.0,
    speedMultiplier: 1.0,
    duration: 90, // seconds
    bgColor: 0xD2B48C,
    skyColor: 0x87CEEB,
    groundColor: 0x8D6E63,
    bgImage: '/assets/images/backgrounds/stage01.png',
    theme: '따스한 햇살 & 자갈길',
    obstacles: ['haystack', 'fence', 'dog', 'duck'],
    bossEvent: '고양이가 건초더미에 파묻힘',
    bossImage: '/assets/images/npcs/cat_grumpy.png'
  },
  {
    id: 2,
    name: 'Stage 2: 울타리 초원 (Fenced Meadow)',
    difficulty: '★★☆☆☆',
    baseSpeed: 14.4,
    speedMultiplier: 1.2,
    duration: 95,
    bgColor: 0x50C878,
    skyColor: 0x64B5F6,
    groundColor: 0x4E342E,
    bgImage: '/assets/images/backgrounds/stage02.png',
    theme: '탁 트인 푸른 목장',
    obstacles: ['fence', 'cow_rushing', 'rock'],
    bossEvent: '고양이 트랙터가 울타리에 걸림',
    bossImage: '/assets/images/npcs/cat_tractor.png'
  },
  {
    id: 3,
    name: 'Stage 3: 시골 집안 (Rustic Farmhouse)',
    difficulty: '★★★☆☆',
    baseSpeed: 15.6,
    speedMultiplier: 1.3,
    duration: 100,
    bgColor: 0x3B2F2F,
    skyColor: 0x212121,
    groundColor: 0xD7CCC8,
    bgImage: '/assets/images/backgrounds/stage03.png',
    theme: '레트로 장판 & 마루',
    obstacles: ['door_sill', 'tea_spill', 'pestle'],
    bossEvent: '고양이가 비단이불에 뒹굴며 클리어',
    bossImage: '/assets/images/npcs/cat_quilt.png'
  },
  {
    id: 4,
    name: 'Stage 4: 시골 산길 (Mountain Dirt Road)',
    difficulty: '★★★★☆',
    baseSpeed: 18.0,
    speedMultiplier: 1.5,
    duration: 110,
    bgColor: 0xFF4500,
    skyColor: 0xE65100,
    groundColor: 0x5D4037,
    bgImage: '/assets/images/backgrounds/stage04.png',
    theme: '석양 산길 & 벼랑',
    obstacles: ['rock', 'old_car', 'cliff_hole'],
    bossEvent: '흔들다리가 끊어지며 고양이 나무에 걸림',
    bossImage: '/assets/images/npcs/cat_unicycle.png'
  },
  {
    id: 5,
    name: 'Stage 5: 시골 5일장 (Rural 5-Day Market)',
    difficulty: '★★★★★',
    baseSpeed: 19.2,
    speedMultiplier: 1.6,
    duration: 120,
    bgColor: 0xE53935,
    skyColor: 0x1E88E5,
    groundColor: 0xBDBDBD,
    bgImage: '/assets/images/backgrounds/stage05.png',
    theme: '와글와글 뻥튀기 시장',
    obstacles: ['apple_box', 'cart', 'market_crowd'],
    bossEvent: '뻥튀기 기계 폭발로 고양이들 하늘로 날아감!',
    bossImage: '/assets/images/fixtures/popcorn_machine.png'
  }
];

export const ItemTypes = {
  RICE: { id: 'rice', name: '쌀알', score: 10, feverInc: 4, color: 0xFFFFFF, image: '/assets/images/items/item_rice.png' },
  CORN: { id: 'corn', name: '옥수수', score: 20, feverInc: 8, color: 0xFFD700, image: '/assets/images/items/item_corn.png' },
  PEPPER: { id: 'pepper', name: '매운 고추', score: 100, feverInc: 25, duration: 4.0, power: 'FIRE_BOOST', color: 0xFF1744, image: '/assets/images/items/item_pepper.png' },
  BANANA: { id: 'banana', name: '황금 바나나', score: 100, feverInc: 25, duration: 8.0, power: 'DOUBLE_JUMP', color: 0xFFEA00, image: '/assets/images/items/item_banana.png' },
  MAGNET: { id: 'magnet', name: '자석 씨앗', score: 100, feverInc: 25, duration: 6.0, power: 'MAGNET_PULL', color: 0x2979FF, image: '/assets/images/items/item_magnet.png' }
};
