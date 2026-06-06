/**
 * Death Battle Knowledge Base
 * 
 * Comprehensive dictionary of VS Battles Wiki terminology, tiering system,
 * powers & abilities, stats, and Death Battle rules.
 * 
 * Source: VS Battles Wiki (298 entries, 452 aliases)
 * Used by AI to understand Death Battle terminology and produce valid arguments.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const knowledgeData = require('../data/knowledge/knowledge_dictionary.json') as KnowledgeDictionary;

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface TierEntry {
  name: string;
  description: string;
  tier_id: string;
}

export interface PowerType {
  type: number;
  name: string;
  description: string;
  examples?: string[];
}

export interface PowerEntry {
  title: string;
  summary: string;
  types: PowerType[];
  uses: string[];
  notes: string;
}

export interface TierDefinition {
  name: string;
  tier: string;
  description: string;
}

export interface StatEntry {
  title: string;
  summary: string;
  tier_definitions: TierDefinition[];
}

export interface GlossaryEntry {
  title: string;
  summary: string;
  types: PowerType[];
}

export interface KnowledgeDictionary {
  meta: {
    version: string;
    source: string;
    total_entries: number;
    categories: string[];
  };
  tiers: Record<string, TierEntry>;
  powers: Record<string, PowerEntry>;
  stats: Record<string, StatEntry>;
  glossary: Record<string, GlossaryEntry>;
  rules: Record<string, unknown>;
  aliases: Record<string, string>;
}

// ═══════════════════════════════════════════
// Knowledge Base Class
// ═══════════════════════════════════════════

export class DeathBattleKnowledge {
  private data: KnowledgeDictionary;
  private searchIndex: Map<string, string[]>; // word → list of entry paths

  constructor() {
    this.data = knowledgeData as KnowledgeDictionary;
    this.searchIndex = this.buildSearchIndex();
  }

  // ─────────────────────────────────────
  // Tier Lookups
  // ─────────────────────────────────────

  /**
   * Get tier info by ID (e.g., "4-B", "3-A", "1-A")
   */
  getTier(tierId: string): TierEntry | null {
    return this.data.tiers[tierId] || null;
  }

  /**
   * Get all tiers in order
   */
  getAllTiers(): TierEntry[] {
    return Object.values(this.data.tiers);
  }

  /**
   * Compare two tiers - returns positive if tier1 > tier2
   * Uses tier ordering: 11-C < 11-B < ... < 1-A < High 1-A
   */
  compareTiers(tier1: string, tier2: string): number {
    const tierOrder = [
      '11-C', '11-B', '11-A',
      '10-C', '10-B', '10-A',
      '9-C', '9-B', '9-A',
      '8-C', 'High 8-C', '8-B', '8-A',
      'Low 7-C', '7-C', 'High 7-C', 'Low 7-B', '7-B', '7-A', 'High 7-A',
      '6-C', 'High 6-C', 'Low 6-B', '6-B', 'High 6-B', '6-A', 'High 6-A',
      '5-C', 'Low 5-B', '5-B', '5-A', 'High 5-A',
      'Low 4-C', '4-C', 'High 4-C', '4-B', '4-A',
      '3-C', '3-B', '3-A', 'High 3-A',
      'Low 2-C', '2-C', '2-B', '2-A',
      'Low 1-C', '1-C', 'High 1-C',
      '1-B', 'High 1-B',
      'Low 1-A', '1-A', 'High 1-A',
      '0'
    ];
    const idx1 = tierOrder.indexOf(tier1);
    const idx2 = tierOrder.indexOf(tier2);
    if (idx1 === -1 || idx2 === -1) return 0;
    return idx1 - idx2;
  }

  // ─────────────────────────────────────
  // Power/Ability Lookups
  // ─────────────────────────────────────

  /**
   * Get power/ability info by name
   */
  getPower(name: string): PowerEntry | null {
    // Direct lookup
    if (this.data.powers[name]) return this.data.powers[name];
    // Alias lookup
    const alias = this.resolveAlias(name);
    if (alias && alias.startsWith('powers.')) {
      const key = alias.replace('powers.', '');
      return this.data.powers[key] || null;
    }
    return null;
  }

  /**
   * Search powers by keyword
   */
  searchPowers(query: string): PowerEntry[] {
    const q = query.toLowerCase();
    const results: PowerEntry[] = [];
    
    for (const [key, entry] of Object.entries(this.data.powers)) {
      if (
        key.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.title.toLowerCase().includes(q)
      ) {
        results.push(entry);
      }
    }
    
    return results.slice(0, 10);
  }

  // ─────────────────────────────────────
  // Stat Lookups
  // ─────────────────────────────────────

  /**
   * Get stat definition (Attack_Potency, Speed, Durability, etc.)
   */
  getStat(name: string): StatEntry | null {
    if (this.data.stats[name]) return this.data.stats[name];
    const alias = this.resolveAlias(name);
    if (alias && alias.startsWith('stats.')) {
      const key = alias.replace('stats.', '');
      return this.data.stats[key] || null;
    }
    return null;
  }

  // ─────────────────────────────────────
  // Glossary & Rules
  // ─────────────────────────────────────

  /**
   * Get glossary term
   */
  getGlossaryTerm(name: string): GlossaryEntry | null {
    if (this.data.glossary[name]) return this.data.glossary[name];
    const alias = this.resolveAlias(name);
    if (alias && alias.startsWith('glossary.')) {
      const key = alias.replace('glossary.', '');
      return this.data.glossary[key] || null;
    }
    return null;
  }

  /**
   * Get Death Battle rules
   */
  getRules(): Record<string, unknown> {
    return this.data.rules;
  }

  /**
   * Get standard battle assumptions
   */
  getSBA(): string[] {
    const sba = this.data.rules.standard_battle_assumptions as { rules: string[] };
    return sba?.rules || [];
  }

  // ─────────────────────────────────────
  // Alias Resolution
  // ─────────────────────────────────────

  /**
   * Resolve an alias to its canonical path
   */
  resolveAlias(term: string): string | null {
    const key = term.toLowerCase().trim();
    return this.data.aliases[key] || null;
  }

  /**
   * Look up any term by alias or direct path
   */
  lookup(term: string): { category: string; entry: unknown } | null {
    // Try alias first
    const aliasPath = this.resolveAlias(term);
    if (aliasPath) {
      return this.resolvePath(aliasPath);
    }
    
    // Try direct lookups
    for (const category of ['tiers', 'powers', 'stats', 'glossary'] as const) {
      if (this.data[category][term]) {
        return { category, entry: this.data[category][term] };
      }
    }
    
    return null;
  }

  /**
   * Resolve a dotted path like "powers.Acausality.types.4"
   */
  private resolvePath(path: string): { category: string; entry: unknown } | null {
    const parts = path.split('.');
    const category = parts[0] as keyof KnowledgeDictionary;
    
    if (!this.data[category]) return null;
    
    let current: unknown = this.data[category];
    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object' && parts[i] in current) {
        current = (current as Record<string, unknown>)[parts[i]];
      } else {
        return null;
      }
    }
    
    return { category: parts[0], entry: current };
  }

  // ─────────────────────────────────────
  // Search
  // ─────────────────────────────────────

  /**
   * Build search index for fast text search
   */
  private buildSearchIndex(): Map<string, string[]> {
    const index = new Map<string, string[]>();
    
    const addToIndex = (word: string, path: string) => {
      const w = word.toLowerCase();
      if (w.length < 3) return;
      if (!index.has(w)) index.set(w, []);
      const arr = index.get(w)!;
      if (!arr.includes(path)) arr.push(path);
    };

    // Index powers
    for (const [key, entry] of Object.entries(this.data.powers)) {
      const path = `powers.${key}`;
      for (const word of key.split(/[_\s]+/)) addToIndex(word, path);
      for (const word of entry.summary.split(/\s+/)) addToIndex(word.replace(/[^a-z]/gi, ''), path);
    }

    // Index tiers
    for (const [key, entry] of Object.entries(this.data.tiers)) {
      const path = `tiers.${key}`;
      for (const word of entry.name.split(/\s+/)) addToIndex(word, path);
      for (const word of entry.description.split(/\s+/)) addToIndex(word.replace(/[^a-z]/gi, ''), path);
    }

    // Index stats
    for (const [key, entry] of Object.entries(this.data.stats)) {
      const path = `stats.${key}`;
      for (const word of key.split(/[_\s]+/)) addToIndex(word, path);
      for (const word of entry.summary.split(/\s+/)) addToIndex(word.replace(/[^a-z]/gi, ''), path);
    }

    // Index glossary
    for (const [key, entry] of Object.entries(this.data.glossary)) {
      const path = `glossary.${key}`;
      for (const word of key.split(/[_\s]+/)) addToIndex(word, path);
      for (const word of entry.summary.split(/\s+/)) addToIndex(word.replace(/[^a-z]/gi, ''), path);
    }

    return index;
  }

  /**
   * Full-text search across all knowledge
   */
  search(query: string, limit: number = 5): Array<{ path: string; category: string; entry: unknown }> {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    const scores = new Map<string, number>();

    for (const word of words) {
      // Exact match
      if (this.searchIndex.has(word)) {
        for (const path of this.searchIndex.get(word)!) {
          scores.set(path, (scores.get(path) || 0) + 2);
        }
      }
      // Prefix match
      for (const [indexedWord, paths] of Array.from(this.searchIndex)) {
        if (indexedWord.startsWith(word) || word.startsWith(indexedWord)) {
          for (const path of paths) {
            scores.set(path, (scores.get(path) || 0) + 1);
          }
        }
      }
    }

    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([path]) => {
      const resolved = this.resolvePath(path);
      return resolved ? { path, ...resolved } : null;
    }).filter(Boolean) as Array<{ path: string; category: string; entry: unknown }>;
  }

  // ─────────────────────────────────────
  // Utility
  // ─────────────────────────────────────

  /**
   * Get knowledge base stats
   */
  getStats() {
    return {
      ...this.data.meta,
      tiers: Object.keys(this.data.tiers).length,
      powers: Object.keys(this.data.powers).length,
      stats: Object.keys(this.data.stats).length,
      glossary: Object.keys(this.data.glossary).length,
      aliases: Object.keys(this.data.aliases).length,
    };
  }

  /**
   * Format a knowledge entry for AI context
   */
  formatForAI(term: string): string | null {
    const result = this.lookup(term);
    if (!result) return null;

    const { category, entry } = result;

    if (category === 'tiers') {
      const t = entry as TierEntry;
      return `[Tier ${t.tier_id}] ${t.name}\n${t.description}`;
    }

    if (category === 'powers') {
      const p = entry as PowerEntry;
      let out = `[${p.title}]\n${p.summary}`;
      if (p.types.length > 0) {
        out += '\n\nTypes:';
        for (const t of p.types) {
          out += `\n- Type ${t.type} (${t.name}): ${t.description}`;
        }
      }
      return out;
    }

    if (category === 'stats') {
      const s = entry as StatEntry;
      let out = `[${s.title}]\n${s.summary}`;
      if (s.tier_definitions.length > 0) {
        out += '\n\nTier Definitions:';
        for (const td of s.tier_definitions) {
          out += `\n- ${td.name} (${td.tier}): ${td.description}`;
        }
      }
      return out;
    }

    if (category === 'glossary') {
      const g = entry as GlossaryEntry;
      return `[${g.title}]\n${g.summary}`;
    }

    return null;
  }
}

// Singleton
let _instance: DeathBattleKnowledge | null = null;

export function getKnowledge(): DeathBattleKnowledge {
  if (!_instance) _instance = new DeathBattleKnowledge();
  return _instance;
}
