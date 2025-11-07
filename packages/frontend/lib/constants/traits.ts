/**
 * KEKTECH Trait Categories and Values
 * Used for filtering and trait exploration
 */

export const TRAIT_CATEGORIES = [
  'Background',
  'Body',
  'Tattoo',
  'Style',
  'Clothes',
  'Tools',
  'Eyes',
  'Glasses',
  'Hat',
  'Special',
  'Easter Eggs'
] as const

export type TraitCategory = typeof TRAIT_CATEGORIES[number]

export interface TraitValue {
  name: string
  count: number
  percentage: string
  displayName: string
}

export const TRAIT_VALUES: Record<string, TraitValue[]> = {
  Background: [
    { name: 'psychedelic', displayName: 'Psychedelic', count: 61, percentage: '1.45%' },
    { name: 'crypto_wallstreet', displayName: 'Crypto Wallstreet', count: 145, percentage: '3.45%' },
    { name: 'creature_cloud', displayName: 'Creature Cloud', count: 152, percentage: '3.62%' },
    { name: 'circus', displayName: 'Circus', count: 160, percentage: '3.81%' },
    { name: 'darkside', displayName: 'Darkside', count: 172, percentage: '4.10%' },
    { name: 'touch_grass', displayName: 'Touch Grass', count: 175, percentage: '4.17%' },
    { name: 'void', displayName: 'Void', count: 627, percentage: '14.93%' },
    { name: 'harmony', displayName: 'Harmony', count: 651, percentage: '15.50%' },
    { name: 'astral', displayName: 'Astral', count: 652, percentage: '15.52%' },
    { name: 'UV', displayName: 'UV', count: 698, percentage: '16.62%' },
    { name: 'shining', displayName: 'Shining', count: 707, percentage: '16.83%' },
  ],
  Body: [
    { name: 'rare_diablo', displayName: 'Rare Diablo', count: 9, percentage: '0.21%' },
    { name: 'RIP', displayName: 'RIP', count: 56, percentage: '1.33%' },
    { name: 'x-ray', displayName: 'X-Ray', count: 129, percentage: '3.07%' },
    { name: 'diablo', displayName: 'Diablo', count: 428, percentage: '10.19%' },
    { name: 'basedAI', displayName: 'BasedAI', count: 433, percentage: '10.31%' },
    { name: 'ghastly', displayName: 'Ghastly', count: 1243, percentage: '29.60%' },
    { name: 'normie', displayName: 'Normie', count: 1902, percentage: '45.29%' },
  ],
  Tattoo: [
    { name: 'kekity_kek', displayName: 'Kekity Kek', count: 157, percentage: '3.74%' },
    { name: 'iron_mike', displayName: 'Iron Mike', count: 212, percentage: '5.05%' },
    { name: '1337', displayName: '1337', count: 415, percentage: '9.88%' },
    { name: '420', displayName: '420', count: 415, percentage: '9.88%' },
    { name: 'kekistan', displayName: 'Kekistan', count: 421, percentage: '10.02%' },
    { name: 'none', displayName: 'None', count: 2580, percentage: '61.43%' },
  ],
  Style: [
    { name: 'rare_demonic', displayName: 'Rare Demonic', count: 294, percentage: '7.00%' },
    { name: 'demonic', displayName: 'Demonic', count: 294, percentage: '7.00%' },
    { name: 'rare_goth', displayName: 'Rare Goth', count: 697, percentage: '16.60%' },
    { name: 'goth', displayName: 'Goth', count: 697, percentage: '16.60%' },
    { name: 'rare_pierced', displayName: 'Rare Pierced', count: 715, percentage: '17.02%' },
    { name: 'pierced', displayName: 'Pierced', count: 715, percentage: '17.02%' },
    { name: 'none', displayName: 'None', count: 2494, percentage: '59.38%' },
  ],
  Clothes: [
    { name: 'kekius', displayName: 'Kekius', count: 30, percentage: '0.71%' },
    { name: 'wizard', displayName: 'Wizard', count: 67, percentage: '1.60%' },
    { name: 'kexico', displayName: 'Kexico', count: 160, percentage: '3.81%' },
    { name: 'kexico_short', displayName: 'Kexico Short', count: 163, percentage: '3.88%' },
    { name: 'mac_kek', displayName: 'Mac Kek', count: 183, percentage: '4.36%' },
    { name: 'OG_Pepecoin', displayName: 'OG Pepecoin', count: 186, percentage: '4.43%' },
    { name: 'brain_owner', displayName: 'Brain Owner', count: 304, percentage: '7.24%' },
    { name: 'green', displayName: 'Green', count: 307, percentage: '7.31%' },
    { name: 'trippy_hippie', displayName: 'Trippy Hippie', count: 307, percentage: '7.31%' },
    { name: 'game_over', displayName: 'Game Over', count: 308, percentage: '7.33%' },
    { name: 'nutmeg', displayName: 'Nutmeg', count: 308, percentage: '7.33%' },
    { name: 'chad', displayName: 'Chad', count: 310, percentage: '7.38%' },
    { name: 'dark', displayName: 'Dark', count: 311, percentage: '7.40%' },
    { name: 'worker', displayName: 'Worker', count: 312, percentage: '7.43%' },
    { name: 'hodler', displayName: 'Hodler', count: 314, percentage: '7.48%' },
    { name: 'hot_nacho', displayName: 'Hot Nacho', count: 315, percentage: '7.50%' },
    { name: 'jeet', displayName: 'Jeet', count: 315, percentage: '7.50%' },
  ],
  Eyes: [
    { name: 'diabolic', displayName: 'Diabolic', count: 79, percentage: '1.88%' },
    { name: 'based', displayName: 'Based', count: 323, percentage: '7.69%' },
    { name: 'wrecked', displayName: 'Wrecked', count: 479, percentage: '11.40%' },
    { name: 'baked', displayName: 'Baked', count: 494, percentage: '11.76%' },
    { name: 'blue', displayName: 'Blue', count: 658, percentage: '15.67%' },
    { name: 'cyan', displayName: 'Cyan', count: 677, percentage: '16.12%' },
    { name: 'confused', displayName: 'Confused', count: 679, percentage: '16.17%' },
    { name: 'straight', displayName: 'Straight', count: 682, percentage: '16.24%' },
    { name: 'none', displayName: 'None', count: 129, percentage: '3.07%' },
  ],
  Glasses: [
    { name: 'rare_patched', displayName: 'Rare Patched', count: 24, percentage: '0.57%' },
    { name: 'patched', displayName: 'Patched', count: 24, percentage: '0.57%' },
    { name: 'rare_AIagent', displayName: 'Rare AI Agent', count: 293, percentage: '6.98%' },
    { name: 'AIagent', displayName: 'AI Agent', count: 293, percentage: '6.98%' },
    { name: 'rare_radioactive', displayName: 'Rare Radioactive', count: 505, percentage: '12.02%' },
    { name: 'radioactive', displayName: 'Radioactive', count: 505, percentage: '12.02%' },
    { name: 'rare_pixel', displayName: 'Rare Pixel', count: 550, percentage: '13.10%' },
    { name: 'pixel', displayName: 'Pixel', count: 550, percentage: '13.10%' },
    { name: 'none', displayName: 'None', count: 2828, percentage: '67.33%' },
  ],
  Hat: [
    { name: 'maximus', displayName: 'Maximus', count: 22, percentage: '0.52%' },
    { name: 'basedgod', displayName: 'Basedgod', count: 59, percentage: '1.40%' },
    { name: 'magic', displayName: 'Magic', count: 76, percentage: '1.81%' },
    { name: 'mad_scientist', displayName: 'Mad Scientist', count: 142, percentage: '3.38%' },
    { name: 'punk', displayName: 'Punk', count: 144, percentage: '3.43%' },
    { name: 'orange', displayName: 'Orange', count: 148, percentage: '3.52%' },
    { name: 'holy', displayName: 'Holy', count: 176, percentage: '4.19%' },
    { name: 'haunted', displayName: 'Haunted', count: 187, percentage: '4.45%' },
    { name: 'fast_food', displayName: 'Fast Food', count: 191, percentage: '4.55%' },
    { name: 'pirate', displayName: 'Pirate', count: 221, percentage: '5.26%' },
    { name: 'gigabrain', displayName: 'Gigabrain', count: 267, percentage: '6.36%' },
    { name: 'headband', displayName: 'Headband', count: 278, percentage: '6.62%' },
    { name: 'curly', displayName: 'Curly', count: 349, percentage: '8.31%' },
    { name: 'chonk', displayName: 'Chonk', count: 410, percentage: '9.76%' },
    { name: 'none', displayName: 'None', count: 1530, percentage: '36.43%' },
  ],
  Special: [
    { name: 'spyware', displayName: 'Spyware', count: 187, percentage: '4.45%' },
    { name: 'rare_whitebeard', displayName: 'Rare Whitebeard', count: 201, percentage: '4.79%' },
    { name: 'whitebeard', displayName: 'Whitebeard', count: 201, percentage: '4.79%' },
    { name: 'rare_hairy', displayName: 'Rare Hairy', count: 766, percentage: '18.24%' },
    { name: 'hairy', displayName: 'Hairy', count: 766, percentage: '18.24%' },
    { name: 'honk', displayName: 'Honk', count: 886, percentage: '21.10%' },
    { name: 'none', displayName: 'None', count: 2160, percentage: '51.43%' },
  ],
  'Easter Eggs': [
    { name: 'personalized trait', displayName: 'Personalized Trait', count: 3, percentage: '0.07%' },
    { name: 'free tattoo lifetime pass', displayName: 'Free Tattoo Lifetime Pass', count: 9, percentage: '0.21%' },
    { name: 'golden ticket boost', displayName: 'Golden Ticket Boost', count: 43, percentage: '1.02%' },
    { name: 'early bird', displayName: 'Early Bird', count: 103, percentage: '2.45%' },
    { name: 'limited edition free mint', displayName: 'Limited Edition Free Mint', count: 420, percentage: '10.00%' },
    { name: 'none', displayName: 'None', count: 3622, percentage: '86.24%' },
  ],
}

/**
 * Get rarity tier based on percentage
 */
export function getRarityTier(percentage: string): {
  label: string
  color: string
  bgColor: string
} {
  const value = parseFloat(percentage)
  if (value < 1) return { label: 'Mythic', color: 'text-purple-400', bgColor: 'bg-purple-500' }
  if (value < 5) return { label: 'Legendary', color: 'text-yellow-400', bgColor: 'bg-yellow-500' }
  if (value < 15) return { label: 'Epic', color: 'text-green-400', bgColor: 'bg-green-500' }
  if (value < 30) return { label: 'Rare', color: 'text-blue-400', bgColor: 'bg-blue-500' }
  return { label: 'Common', color: 'text-cyan-400', bgColor: 'bg-cyan-500' }
}
