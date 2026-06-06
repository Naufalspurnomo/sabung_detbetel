/**
 * Knowledge Service
 * 
 * Bridges the knowledge dictionary with the AI judge system.
 * Provides context enrichment for character profiles and debate analysis.
 * 
 * NOW INCLUDES: Scientific knowledge (physics formulas, feat methodology)
 * and Death Battle format template for structured AI output.
 */

import { getKnowledge, type PowerEntry, type TierEntry } from './knowledge-base';
import type { CharacterProfile } from './types';
import {
  PHYSICS_FORMULAS,
  ENERGY_UNITS,
  SPEED_TIERS,
  PHYSICAL_CONSTANTS,
  REFERENCE_FEATS,
  FEAT_METHODOLOGY,
  SCIENTIFIC_REASONING,
} from './death-battle-science';
import { buildDeathBattleSystemPrompt } from './death-battle-format';

// ═══════════════════════════════════════════
// Context Builder for AI
// ═══════════════════════════════════════════

/**
 * Build a rich system prompt for the AI judge that includes all relevant
 * Death Battle knowledge so the AI can produce accurate, well-sourced arguments.
 */
export function buildKnowledgeSystemPrompt(): string {
  const kb = getKnowledge();
  const stats = kb.getStats();
  
  // Build the base knowledge prompt
  const basePrompt = `You are an expert Death Battle judge powered by a comprehensive VS Battles Wiki knowledge base.

KNOWLEDGE BASE: ${stats.total_entries} entries (${stats.tiers} tiers, ${stats.powers} powers, ${stats.stats} stats, ${stats.glossary} glossary terms)

## How Death Battle Works

${formatSBA(kb)}

## Tiering System

${formatTierSummary(kb)}

## Key Rules

${formatRules(kb)}`;

  // Build the science prompt
  const sciencePrompt = buildSciencePrompt();

  // Use the Death Battle format template to combine everything
  return buildDeathBattleSystemPrompt(basePrompt, sciencePrompt);
}

/**
 * Build the scientific knowledge section of the prompt.
 */
function buildSciencePrompt(): string {
  let output = `# 🔬 SCIENTIFIC KNOWLEDGE BASE

## Physics Formulas Used in Death Battle

`;
  
  // Add key formulas
  for (const [key, formula] of Object.entries(PHYSICS_FORMULAS)) {
    output += `**${formula.formula}**
${formula.description}
Example: ${formula.example}

`;
  }

  // Add energy unit conversions
  output += `## Energy Unit Conversions

`;
  const importantUnits = ['joule', 'ton_tnt', 'kiloton_tnt', 'megaton_tnt', 'gigaton_tnt', 'foe'];
  for (const unitKey of importantUnits) {
    const unit = ENERGY_UNITS[unitKey as keyof typeof ENERGY_UNITS];
    output += `- **${unit.symbol}** = ${unit.joules.toExponential(2)} J — ${unit.description}
`;
  }

  // Add speed tiers
  output += `
## Speed Classifications

`;
  for (const [key, tier] of Object.entries(SPEED_TIERS)) {
    output += `- **${tier.label}**: ${tier.mps.toExponential(2)} m/s — ${tier.description}
`;
  }

  // Add reference feats
  output += `
## Reference Feats (Pre-calculated)

### Destruction Feats
`;
  for (const [key, feat] of Object.entries(REFERENCE_FEATS)) {
    if ('energy_joules' in feat) {
      output += `- ${feat.description} — ${feat.energy_joules.toExponential(2)} J
`;
    }
  }

  output += `
### Speed Feats
`;
  for (const [key, feat] of Object.entries(REFERENCE_FEATS)) {
    if ('speed_mps' in feat) {
      output += `- ${feat.description} — ${feat.speed_mps.toExponential(2)} m/s
`;
    }
  }

  output += `
### Lifting Feats
`;
  for (const [key, feat] of Object.entries(REFERENCE_FEATS)) {
    if ('force_newtons' in feat) {
      output += `- ${feat.description} — ${feat.force_newtons.toExponential(2)} N
`;
    }
  }

  // Add feat methodology
  output += `
${FEAT_METHODOLOGY}

## Scientific Reasoning Principles

${SCIENTIFIC_REASONING.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Physical Constants Reference

- Speed of Light (c): ${PHYSICAL_CONSTANTS.speed_of_light.toExponential(3)} m/s
- Mach 1: ${PHYSICAL_CONSTANTS.mach_1} m/s
- Earth Mass: ${PHYSICAL_CONSTANTS.earth_mass.toExponential(3)} kg
- Earth Radius: ${PHYSICAL_CONSTANTS.earth_radius.toLocaleString()} m
- Moon Mass: ${PHYSICAL_CONSTANTS.moon_mass.toExponential(3)} kg
- Sun Mass: ${PHYSICAL_CONSTANTS.sun_mass.toExponential(3)} kg
- Gravitational Constant (G): ${PHYSICAL_CONSTANTS.gravitational_constant.toExponential(3)} m³/(kg·s²)
- Standard Gravity (g): ${PHYSICAL_CONSTANTS.standard_gravity} m/s²
- Earth GBE: ${REFERENCE_FEATS.destroy_planet.energy_joules.toExponential(2)} J
`;

  return output;
}

/**
 * Enrich a character profile with knowledge dictionary data.
 * Adds ability descriptions, tier explanations, and stat context.
 */
export function enrichProfile(profile: CharacterProfile): EnrichedProfile {
  const kb = getKnowledge();
  
  const enrichedAbilities = profile.abilities.map(ability => {
    const power = kb.getPower(ability);
    return {
      name: ability,
      description: power?.summary || '',
      types: power?.types || [],
      isHax: isHaxAbility(ability),
    };
  });

  const tierInfo = kb.getTier(profile.tier);
  
  return {
    ...profile,
    enrichedAbilities,
    tierInfo: tierInfo ? {
      name: tierInfo.name,
      description: tierInfo.description,
    } : null,
    haxCount: enrichedAbilities.filter(a => a.isHax).length,
    haxList: enrichedAbilities.filter(a => a.isHax).map(a => a.name),
  };
}

/**
 * Get context for a specific ability or term for the AI.
 * Used to inject relevant knowledge when the AI discusses an ability.
 */
export function getAbilityContext(abilityName: string): string | null {
  const kb = getKnowledge();
  return kb.formatForAI(abilityName);
}

/**
 * Search knowledge base for relevant terms given a debate topic.
 */
export function getRelevantKnowledge(query: string, limit: number = 5): string[] {
  const kb = getKnowledge();
  const results = kb.search(query, limit);
  return results.map(r => {
    const formatted = kb.formatForAI(r.path.split('.').pop() || '');
    return formatted || '';
  }).filter(Boolean);
}

// ═══════════════════════════════════════════
// Hax Detection
// ═══════════════════════════════════════════

const HAX_KEYWORDS = [
  'time manipulation', 'time stop', 'time slow',
  'existence erasure', 'reality warping',
  'mind manipulation', 'mind control', 'telepathy',
  'soul manipulation', 'soul destruction',
  'conceptual manipulation', 'concept destruction',
  'causality manipulation', 'fate manipulation', 'probability manipulation',
  'death manipulation', 'instant death',
  'durability negation', 'bypassing durability',
  'matter manipulation', 'transmutation',
  'spatial manipulation', 'bfr', 'battlefield removal',
  'sealing', 'power nullification', 'power absorption',
  'regeneration negation', 'immortality negation',
  'plot manipulation', 'information manipulation',
  'acausality', 'nonexistent physiology',
  'invulnerability', 'intangibility',
  'gravity manipulation', 'black hole creation',
];

function isHaxAbility(name: string): boolean {
  const lower = name.toLowerCase();
  return HAX_KEYWORDS.some(keyword => lower.includes(keyword));
}

// ═══════════════════════════════════════════
// Formatting Helpers
// ═══════════════════════════════════════════

function formatSBA(kb: ReturnType<typeof getKnowledge>): string {
  const sba = kb.getSBA();
  if (!sba.length) return 'Standard Battle Assumptions: (not loaded)';
  
  return `### Standard Battle Assumptions (SBA)
${sba.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`;
}

function formatTierSummary(kb: ReturnType<typeof getKnowledge>): string {
  const tiers = kb.getAllTiers();
  if (!tiers.length) return 'Tiering system: (not loaded)';
  
  // Show key tiers with brief descriptions
  const keyTiers = ['11-C', '9-C', '8-C', '5-B', '4-B', '3-A', '2-C', '1-A', 'High 1-A'];
  const lines = keyTiers.map(id => {
    const tier = kb.getTier(id);
    if (!tier) return null;
    return `- **${id}** (${tier.name}): ${tier.description.slice(0, 120)}...`;
  }).filter(Boolean);
  
  return `### VS Battles Tiering System (abbreviated)
${lines.join('\n')}

Full tier list: 11-C → 11-B → 11-A → 10-C → ... → 3-A → High 3-A → Low 2-C → 2-C → ... → 1-A → High 1-A → 0

Each tier gap is EXPONENTIAL. A character 2+ tiers above stomps unless extreme hax difference.`;
}

function formatRules(kb: ReturnType<typeof getKnowledge>): string {
  const rules = kb.getRules() as Record<string, { title: string; rules?: string[]; ratings?: Record<string, string>; terms?: Record<string, string> }>;
  
  let output = '';
  
  // Difficulty ratings
  if (rules.difficulty_ratings?.ratings) {
    output += '### Difficulty Ratings\n';
    for (const [name, desc] of Object.entries(rules.difficulty_ratings.ratings)) {
      output += `- **${name}**: ${desc}\n`;
    }
    output += '\n';
  }
  
  // Key terminology (abbreviated)
  if (rules.key_terminology?.terms) {
    output += '### Key Terminology\n';
    const importantTerms = ['AP', 'Hax', 'BFR', 'Blitz', 'Stomp', 'SBA', 'Feat', 'Statement', 'Outlier', 'PIS', 'Scaling', 'Speed Equalized', 'Bloodlust', 'In-Character'];
    for (const term of importantTerms) {
      const def = rules.key_terminology.terms[term];
      if (def) output += `- **${term}**: ${def}\n`;
    }
  }
  
  return output;
}

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface EnrichedAbility {
  name: string;
  description: string;
  types: Array<{ type: number; name: string; description: string }>;
  isHax: boolean;
}

export interface EnrichedProfile extends CharacterProfile {
  enrichedAbilities: EnrichedAbility[];
  tierInfo: { name: string; description: string } | null;
  haxCount: number;
  haxList: string[];
}
