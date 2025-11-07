'use client'

import { useState } from 'react'

/**
 * Trait distribution data for KEKTECH NFT Collection
 * Source: Official collection data with 4200 total supply
 */
const traitDistributions = {
  background: {
    psychedelic: { count: 61, percentage: '1.45%' },
    crypto_wallstreet: { count: 145, percentage: '3.45%' },
    creature_cloud: { count: 152, percentage: '3.62%' },
    circus: { count: 160, percentage: '3.81%' },
    darkside: { count: 172, percentage: '4.10%' },
    touch_grass: { count: 175, percentage: '4.17%' },
    void: { count: 627, percentage: '14.93%' },
    harmony: { count: 651, percentage: '15.50%' },
    astral: { count: 652, percentage: '15.52%' },
    UV: { count: 698, percentage: '16.62%' },
    shining: { count: 707, percentage: '16.83%' },
  },
  body: {
    rare_diablo: { count: 9, percentage: '0.21%' },
    RIP: { count: 56, percentage: '1.33%' },
    'x-ray': { count: 129, percentage: '3.07%' },
    diablo: { count: 428, percentage: '10.19%' },
    basedAI: { count: 433, percentage: '10.31%' },
    ghastly: { count: 1243, percentage: '29.60%' },
    normie: { count: 1902, percentage: '45.29%' },
  },
  tattoo: {
    kekity_kek: { count: 157, percentage: '3.74%' },
    iron_mike: { count: 212, percentage: '5.05%' },
    '1337': { count: 415, percentage: '9.88%' },
    '420': { count: 415, percentage: '9.88%' },
    kekistan: { count: 421, percentage: '10.02%' },
    none: { count: 2580, percentage: '61.43%' },
  },
  style: {
    rare_demonic: { count: 294, percentage: '7.00%' },
    demonic: { count: 294, percentage: '7.00%' },
    rare_goth: { count: 697, percentage: '16.60%' },
    goth: { count: 697, percentage: '16.60%' },
    rare_pierced: { count: 715, percentage: '17.02%' },
    pierced: { count: 715, percentage: '17.02%' },
    none: { count: 2494, percentage: '59.38%' },
  },
  clothes: {
    kekius: { count: 30, percentage: '0.71%' },
    wizard: { count: 67, percentage: '1.60%' },
    kexico: { count: 160, percentage: '3.81%' },
    kexico_short: { count: 163, percentage: '3.88%' },
    mac_kek: { count: 183, percentage: '4.36%' },
    OG_Pepecoin: { count: 186, percentage: '4.43%' },
    brain_owner: { count: 304, percentage: '7.24%' },
    green: { count: 307, percentage: '7.31%' },
    trippy_hippie: { count: 307, percentage: '7.31%' },
    game_over: { count: 308, percentage: '7.33%' },
    nutmeg: { count: 308, percentage: '7.33%' },
    chad: { count: 310, percentage: '7.38%' },
    dark: { count: 311, percentage: '7.40%' },
    worker: { count: 312, percentage: '7.43%' },
    hodler: { count: 314, percentage: '7.48%' },
    hot_nacho: { count: 315, percentage: '7.50%' },
    jeet: { count: 315, percentage: '7.50%' },
  },
  tools: {
    rare_golden_tickets: { count: 43, percentage: '1.02%' },
    golden_tickets: { count: 43, percentage: '1.02%' },
    rare_coal: { count: 130, percentage: '3.10%' },
    coal: { count: 130, percentage: '3.10%' },
    rare_sorcerer: { count: 145, percentage: '3.45%' },
    sorcerer: { count: 145, percentage: '3.45%' },
    rare_OG_reverse: { count: 265, percentage: '6.31%' },
    OG_reverse: { count: 265, percentage: '6.31%' },
    rare_pepepaint: { count: 265, percentage: '6.31%' },
    pepepaint: { count: 265, percentage: '6.31%' },
    rare_pokemon: { count: 538, percentage: '12.81%' },
    pokemon: { count: 538, percentage: '12.81%' },
    rare_scythe: { count: 547, percentage: '13.02%' },
    scythe: { count: 547, percentage: '13.02%' },
    rare_blunt: { count: 548, percentage: '13.05%' },
    blunt: { count: 548, percentage: '13.05%' },
    rare_bamboo: { count: 549, percentage: '13.07%' },
    bamboo: { count: 549, percentage: '13.07%' },
    rare_reward: { count: 552, percentage: '13.14%' },
    reward: { count: 552, percentage: '13.14%' },
    rare_flipper: { count: 553, percentage: '13.17%' },
    flipper: { count: 553, percentage: '13.17%' },
  },
  eyes: {
    diabolic: { count: 79, percentage: '1.88%' },
    based: { count: 323, percentage: '7.69%' },
    wrecked: { count: 479, percentage: '11.40%' },
    baked: { count: 494, percentage: '11.76%' },
    blue: { count: 658, percentage: '15.67%' },
    cyan: { count: 677, percentage: '16.12%' },
    confused: { count: 679, percentage: '16.17%' },
    straight: { count: 682, percentage: '16.24%' },
    none: { count: 129, percentage: '3.07%' },
  },
  glasses: {
    rare_patched: { count: 24, percentage: '0.57%' },
    patched: { count: 24, percentage: '0.57%' },
    rare_AIagent: { count: 293, percentage: '6.98%' },
    AIagent: { count: 293, percentage: '6.98%' },
    rare_radioactive: { count: 505, percentage: '12.02%' },
    radioactive: { count: 505, percentage: '12.02%' },
    rare_pixel: { count: 550, percentage: '13.10%' },
    pixel: { count: 550, percentage: '13.10%' },
    none: { count: 2828, percentage: '67.33%' },
  },
  hat: {
    maximus: { count: 22, percentage: '0.52%' },
    basedgod: { count: 59, percentage: '1.40%' },
    magic: { count: 76, percentage: '1.81%' },
    mad_scientist: { count: 142, percentage: '3.38%' },
    punk: { count: 144, percentage: '3.43%' },
    orange: { count: 148, percentage: '3.52%' },
    holy: { count: 176, percentage: '4.19%' },
    haunted: { count: 187, percentage: '4.45%' },
    fast_food: { count: 191, percentage: '4.55%' },
    pirate: { count: 221, percentage: '5.26%' },
    gigabrain: { count: 267, percentage: '6.36%' },
    headband: { count: 278, percentage: '6.62%' },
    curly: { count: 349, percentage: '8.31%' },
    chonk: { count: 410, percentage: '9.76%' },
    none: { count: 1530, percentage: '36.43%' },
  },
  special: {
    spyware: { count: 187, percentage: '4.45%' },
    rare_whitebeard: { count: 201, percentage: '4.79%' },
    whitebeard: { count: 201, percentage: '4.79%' },
    rare_hairy: { count: 766, percentage: '18.24%' },
    hairy: { count: 766, percentage: '18.24%' },
    honk: { count: 886, percentage: '21.10%' },
    none: { count: 2160, percentage: '51.43%' },
  },
  'easter-eggs': {
    'personalized trait': { count: 3, percentage: '0.07%' },
    'free tattoo lifetime pass': { count: 9, percentage: '0.21%' },
    'golden ticket boost': { count: 43, percentage: '1.02%' },
    'early bird': { count: 103, percentage: '2.45%' },
    'limited edition free mint': { count: 420, percentage: '10.00%' },
    none: { count: 3622, percentage: '86.24%' },
  },
}

type TraitCategory = keyof typeof traitDistributions

/**
 * Get rarity level based on percentage
 * Colors match the old kektech.xyz website
 */
function getRarity(percentage: string): { label: string; color: string; bgColor: string } {
  const value = parseFloat(percentage)
  if (value < 1) return { label: 'Mythic', color: 'text-purple-400', bgColor: 'bg-purple-500' }
  if (value < 5) return { label: 'Legendary', color: 'text-yellow-400', bgColor: 'bg-yellow-500' }
  if (value < 15) return { label: 'Epic', color: 'text-green-400', bgColor: 'bg-green-500' }
  if (value < 30) return { label: 'Rare', color: 'text-blue-400', bgColor: 'bg-blue-500' }
  return { label: 'Common', color: 'text-cyan-400', bgColor: 'bg-cyan-500' }
}

/**
 * Format trait name for display
 */
function formatTraitName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * TraitDistribution Component
 *
 * Organized trait distribution viewer with category tabs
 */
export function TraitDistribution() {
  const [activeCategory, setActiveCategory] = useState<TraitCategory>('background')

  const categories: { key: TraitCategory; label: string }[] = [
    { key: 'background', label: 'Background' },
    { key: 'body', label: 'Body' },
    { key: 'tattoo', label: 'Tattoo' },
    { key: 'style', label: 'Style' },
    { key: 'clothes', label: 'Clothes' },
    { key: 'tools', label: 'Tools' },
    { key: 'eyes', label: 'Eyes' },
    { key: 'glasses', label: 'Glasses' },
    { key: 'hat', label: 'Hat' },
    { key: 'special', label: 'Special' },
    { key: 'easter-eggs', label: 'Easter Eggs' },
  ]

  // Get traits and sort by percentage (ascending - rarest first)
  const traits = Object.entries(traitDistributions[activeCategory]).sort((a, b) => {
    const percentA = parseFloat(a[1].percentage)
    const percentB = parseFloat(b[1].percentage)
    return percentA - percentB
  })

  return (
    <div className="mx-auto max-w-7xl">
      {/* Category Tabs */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === key
                ? 'bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] text-black shadow-md shadow-[#3fb8bd]/30'
                : 'border border-[#3fb8bd]/20 bg-gray-900 text-gray-400 hover:border-[#3fb8bd]/50 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Traits Table */}
      <div className="relative overflow-hidden rounded-lg border border-[#3fb8bd]/20 bg-gray-900">
        {/* Checkered Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider text-[#3fb8bd]">
                  Trait
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-[#3fb8bd]">
                  Count
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-[#3fb8bd]">
                  %
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold uppercase tracking-wider text-[#3fb8bd]">
                  Rarity
                </th>
              </tr>
            </thead>
            <tbody>
              {traits.map(([name, data]) => {
                const rarity = getRarity(data.percentage)
                return (
                  <tr
                    key={name}
                    className="transition-colors hover:bg-[#3fb8bd]/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {formatTraitName(name)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-300">
                      {data.count}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-[#3fb8bd]">
                      {data.percentage}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-block rounded-md px-3 py-1 text-xs font-bold ${rarity.bgColor} text-black`}
                      >
                        {rarity.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Showing {traits.length} traits in {formatTraitName(activeCategory)} category
      </div>
    </div>
  )
}
