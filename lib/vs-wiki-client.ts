import { fallbackFeats, fallbackSearch, getFallbackCharacter } from "./mock-data";
import type { CharacterProfile, Feat, SearchResult, SourceLink } from "./types";

const API_BASE = "https://vsbattles.fandom.com/api.php";
const WIKI_BASE = "https://vsbattles.fandom.com/wiki/";

// ── Tier template resolver ──────────────────────────────────────────
const TIER_MAP: Record<string, string> = {
  "0": "Boundless",
  "11-C": "Low Hypoverse level",
  "11-B": "Hypoverse level",
  "11-A": "High Hypoverse level",
  "10-C": "Below Average Human level",
  "10-B": "Human level",
  "10-A": "Athlete level",
  "9-C": "Street level",
  "9-B": "Wall level",
  "9-A": "Small Building level",
  "8-C": "Building level",
  "High 8-C": "Large Building level",
  "8-B": "City Block level",
  "8-A": "Multi-City Block level",
  "Low 7-C": "Small Town level",
  "7-C": "Town level",
  "High 7-C": "Large Town level",
  "Low 7-B": "Small City level",
  "7-B": "City level",
  "7-A": "Mountain level",
  "High 7-A": "Large Mountain level",
  "6-C": "Island level",
  "High 6-C": "Large Island level",
  "Low 6-B": "Small Country level",
  "6-B": "Country level",
  "High 6-B": "Large Country level",
  "6-A": "Continent level",
  "High 6-A": "Multi-Continent level",
  "5-C": "Moon level",
  "Low 5-B": "Small Planet level",
  "5-B": "Planet level",
  "5-A": "Large Planet level",
  "High 5-A": "Brown Dwarf level",
  "Low 4-C": "Small Star level",
  "4-C": "Star level",
  "High 4-C": "Large Star level",
  "4-B": "Solar System level",
  "4-A": "Multi-Solar System level",
  "3-C": "Galaxy level",
  "3-B": "Multi-Galaxy level",
  "High 3-A": "High Universe level",
  "3-A": "Universe level",
  "Low 2-C": "Universe level+",
  "2-C": "Low Multiverse level",
  "2-B": "Multiverse level",
  "2-A": "Multiverse level+",
  "Low 1-C": "Low Complex Multiverse level",
  "1-C": "Complex Multiverse level",
  "High 1-C": "High Complex Multiverse level",
  "1-B": "Hyperverse level",
  "High 1-B": "High Hyperverse level",
  "Low 1-A": "Low Outerverse level",
  "1-A": "Outerverse level",
  "High 1-A": "High Outerverse level"
};

function resolveTierTemplates(text: string): string {
  return text
    .replace(
      /\{\{(High|Low)?\s*(\d+-[A-C])\}\}/gi,
      (_m, prefix: string, code: string) => {
        const upper = code.toUpperCase();
        if (prefix) {
          const key = `${prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase()} ${upper}`;
          return TIER_MAP[key] ?? TIER_MAP[upper] ?? code;
        }
        return TIER_MAP[upper] ?? code;
      }
    )
    .replace(/\{\{Tier 0\}\}/gi, "Boundless");
}

type SearchApiResponse = {
  query?: {
    search?: Array<{ title: string; snippet?: string }>;
  };
};

type PageApiResponse = {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        revisions?: Array<{
          slots?: { main?: { "*": string } };
          "*": string;
        }>;
        thumbnail?: { source?: string };
        original?: { source?: string };
        categories?: Array<{ title: string }>;
        links?: Array<{ title: string }>;
      }
    >;
  };
};

export async function searchCharacters(query: string): Promise<SearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: cleanQuery,
    srlimit: "8",
    format: "json",
    origin: "*"
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: wikiHeaders(),
      next: { revalidate: 3600 }
    } as any);
    if (!response.ok) throw new Error(`VS Wiki search failed: ${response.status}`);

    const data = (await response.json()) as SearchApiResponse;
    const results = data.query?.search ?? [];
    return results.map((r) => ({
      title: r.title,
      snippet: stripHtml(r.snippet ?? ""),
      url: wikiUrl(r.title)
    }));
  } catch {
    return fallbackSearch(cleanQuery);
  }
}

export async function getCharacterProfile(pageTitle: string): Promise<CharacterProfile> {
  const fallback = getFallbackCharacter(pageTitle);
  const normalizedTitle = decodeURIComponent(pageTitle).replace(/_/g, " ");

  const params = new URLSearchParams({
    action: "query",
    prop: "revisions|pageimages|categories|links",
    titles: normalizedTitle,
    redirects: "1",
    rvprop: "content",
    rvslots: "main",
    piprop: "original|thumbnail",
    pithumbsize: "640",
    cllimit: "max",
    pllimit: "max",
    format: "json",
    origin: "*"
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: wikiHeaders(),
      next: { revalidate: 86400 }
    } as any);
    if (!response.ok) throw new Error(`Profil VS Wiki gagal dimuat: ${response.status}`);

    const data = (await response.json()) as PageApiResponse;
    const page = Object.values(data.query?.pages ?? {})[0];
    const content =
      page?.revisions?.[0]?.slots?.main?.["*"] ??
      page?.revisions?.[0]?.["*"] ??
      "";

    if (!page?.title || !content) {
      return fallback ?? profileFromUnknown(normalizedTitle);
    }

    return parseProfile({
      pageTitle: page.title,
      wikitext: content,
      imageUrl: page.original?.source ?? page.thumbnail?.source,
      categories: page.categories?.map((c) => c.title) ?? [],
      links: page.links?.map((l) => l.title) ?? []
    });
  } catch {
    return fallback ?? profileFromUnknown(normalizedTitle);
  }
}

export async function getCharacterFeats(pageTitle: string): Promise<Feat[]> {
  const profile = await getCharacterProfile(pageTitle);
  return featsFromProfile(profile);
}

export function featsFromProfile(profile: CharacterProfile): Feat[] {
  const feats: Feat[] = [
    {
      id: `${profile.id}-attack-potency`,
      category: "Strength",
      title: "Attack Potency",
      description: profile.attackPotency,
      source: profile.sourceLinks[0],
      confidence: profile.attackPotency === "Unknown" ? "low" : "high"
    },
    {
      id: `${profile.id}-speed`,
      category: "Speed",
      title: "Speed",
      description: profile.speed,
      source: profile.sourceLinks[0],
      confidence: profile.speed === "Unknown" ? "low" : "high"
    },
    {
      id: `${profile.id}-durability`,
      category: "Durability",
      title: "Durability",
      description: profile.durability,
      source: profile.sourceLinks[0],
      confidence: profile.durability === "Unknown" ? "low" : "high"
    }
  ];

  const hax = profile.abilities.filter((a) =>
    /time|reality|existence|mind|soul|causality|fate|concept|regeneration/i.test(a)
  );

  hax.slice(0, 5).forEach((ability, i) => {
    feats.push({
      id: `${profile.id}-hax-${i}`,
      category: "Hax",
      title: ability,
      description: `${profile.shortName} punya ${ability}. Cek mekanik dan batasannya dari profil sebelum dipakai sebagai win condition.`,
      source: profile.sourceLinks[0],
      confidence: "medium"
    });
  });

  return feats.length ? feats : fallbackFeats(profile);
}

// ── Profile Parser ──────────────────────────────────────────────────
//
// VS Wiki structure for ==Powers and Stats== section:
//
// '''[[Tiering System|Tier]]:''' {{4-B}} | {{2-C}} | ...  ← ALL keys in one line, |-separated
// '''Key:''' '''Battle of Gods''' | '''Res.''' | ...      ← Key names
//
// <tabber>                                                ← Tabber: per-key AP values
// |-|Battle of Gods='''[[Attack Potency]]:''' value...
// |-|Resurrection 'F'='''[[Attack Potency]]:''' value...
// </tabber>
//
// '''[[Speed]]:''' value...                               ← Shared across all keys
// '''[[Lifting Strength]]:''' value...
// '''[[Striking Strength]]:''' value...
// '''[[Durability]]:''' value...
// '''[[Stamina]]:''' value...
// '''[[Range]]:''' value...
// '''[[Intelligence]]:''' value...
// '''Weaknesses:''' value...

function parseProfile(input: {
  pageTitle: string;
  wikitext: string;
  imageUrl?: string;
  categories: string[];
  links: string[];
}): CharacterProfile {
  const statsSection =
    extractSection(input.wikitext, "Powers and Stats") ?? input.wikitext;

  // Resolve tier templates on the raw section first
  const resolved = resolveTierTemplates(statsSection);

  // Extract each stat
  const tierRaw = readInlineBold(resolved, ["Tiering System|Tier", "Tier"]) ?? "Unknown";
  const keysRaw = readInlineBold(resolved, ["Key", "Keys"]) ?? "";

  // AP: might be in tabber (multi-key) or inline (single-key)
  const apRaw = readLastTabberValue(resolved, "Attack Potency") ??
                readInlineBold(resolved, ["Attack Potency"]) ??
                "Unknown";

  // Speed/Durability/Intelligence: inline bold fields
  const speedRaw = readInlineBold(resolved, ["Speed"]) ?? "Unknown";
  const durRaw = readInlineBold(resolved, ["Durability"]) ?? "Unknown";
  const intRaw = readInlineBold(resolved, ["Intelligence"]) ?? "Unknown";
  const weakRaw = (() => {
    // Direct extraction for Weaknesses - readInlineBold has regex escaping issues
    const m = resolved.match(/'''Weaknesses:'''([\s\S]*?)(?=\n\n|$)/i);
    return m?.[1]?.trim() ?? "";
  })();

  const seriesRaw = readInlineBold(statsSection, ["Verse", "Origin"]) ?? "";

  const source: SourceLink = {
    label: "Profil VS Battles Wiki",
    url: wikiUrl(input.pageTitle),
    type: "profile"
  };

  return {
    id: slugify(input.pageTitle),
    pageTitle: input.pageTitle,
    name: cleanName(input.pageTitle),
    shortName: cleanName(input.pageTitle).split("(")[0].trim(),
    series: cleanWikiText(seriesRaw) || inferSeries(input.categories, input.links),
    tier: cleanWikiText(tierRaw),
    attackPotency: cleanWikiText(apRaw),
    speed: cleanWikiText(speedRaw),
    durability: cleanWikiText(durRaw),
    intelligence: cleanWikiText(intRaw),
    abilities: extractAbilities(input.wikitext),
    weaknesses: splitList(cleanWikiText(weakRaw)),
    keys: parseKeys(keysRaw),
    imageUrl: input.imageUrl,
    wikiUrl: wikiUrl(input.pageTitle),
    rawStats: {
      tier: tierRaw,
      attackPotency: apRaw,
      speed: speedRaw,
      durability: durRaw,
      intelligence: intRaw,
      weakness: weakRaw
    },
    sourceLinks: [source],
    cached: false,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

function profileFromUnknown(pageTitle: string): CharacterProfile {
  const cleanTitle = cleanName(pageTitle);
  return {
    id: slugify(pageTitle),
    pageTitle,
    name: cleanTitle,
    shortName: cleanTitle,
    series: "Unknown",
    tier: "Unknown",
    attackPotency: "Unknown",
    speed: "Unknown",
    durability: "Unknown",
    intelligence: "Unknown",
    abilities: [],
    weaknesses: [],
    keys: [],
    wikiUrl: wikiUrl(pageTitle),
    rawStats: {},
    sourceLinks: [{ label: "Profil VS Battles Wiki", url: wikiUrl(pageTitle), type: "profile" }],
    cached: false,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

// ── Stat Field Readers ──────────────────────────────────────────────

// Read the LAST tabber value for a stat (multi-key characters).
// Format: |-|Key='''[[StatName]]:''' value...
// Returns raw wikitext (needs cleanWikiText).
function readLastTabberValue(section: string, statName: string): string | undefined {
  const escaped = escapeRegex(statName);
  // Use RegExp constructor with properly escaped strings
  const pat = `\\|\\-\\|[^=]+?='''\\[\\[${escaped}(?:\\|[^\\]]+)?\\]\\]\\s*:?\\s*'''\\s*:?\\s*([\\s\\S]*?)(?=\\|\\-\\||<\\/tabber>|\\{\\{Border|\\n'''\\[\\[|$)`;
  const pattern = new RegExp(pat, "gi");

  let lastMatch: string | undefined;
  let m;
  while ((m = pattern.exec(section)) !== null) {
    const val = m[1]?.trim();
    if (val) lastMatch = val;
  }
  return lastMatch;
}

// Read inline bold field: '''[[...|FieldName]]:''' value
// Multi-line: reads until next '''field''', tabber, double newline, or end of section.
// Returns the LAST match (for multi-key characters, last = most recent).
function readInlineBold(section: string, names: string[]): string | undefined {
  for (const name of names) {
    const escaped = escapeRegex(name);
    let lastMatch: string | undefined;

    // Terminators: next bold field, tabber separator, double newline, Border template, </tabber>
    const T = "(?=\\n'''\\[\\[|\\n'''[A-Z]|\\|\\-\\||<\\/tabber>|\\n\\n|\\{\\{Border|$)";

    // Try: '''[[LinkText|FieldName]]:''' value
    const lp = `'''\\s*\\[\\[[^\\]]*${escaped}[^\\]]*\\]\\]\\s*:?\\s*'''\\s*:?\\s*([\\s\\S]*?)${T}`;
    const linkedPattern = new RegExp(lp, "gi");
    let m;
    while ((m = linkedPattern.exec(section)) !== null) {
      if (m[1]?.trim()) lastMatch = m[1].trim();
    }

    // Try: '''FieldName:''' value (no wikilink, like Weaknesses)
    const pp = `'''\\s*${escaped}\\s*:?'*\\s*:?\\s*([\\s\\S]*?)${T}`;
    const plainPattern = new RegExp(pp, "gi");
    while ((m = plainPattern.exec(section)) !== null) {
      if (m[1]?.trim()) lastMatch = m[1].trim();
    }

    if (lastMatch) return lastMatch;
  }

  return undefined;
}

// ── Key Parser ──────────────────────────────────────────────────────

function parseKeys(keysRaw: string): string[] {
  if (!keysRaw) return [];
  return keysRaw
    .split(/\s*\|\s*/)
    .map((k) => cleanWikiText(k).replace(/^'+|'+$/g, "").trim())
    .filter((k) => k.length > 0 && k.length < 100);
}

// ── Wikitext Cleaner ────────────────────────────────────────────────

function cleanWikiText(value: string): string {
  let r = value;

  // 1. <ref>...</ref> and <ref ... />
  r = r.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  r = r.replace(/<ref[^\/]*\/>/gi, "");

  // 2. <gallery>
  r = r.replace(/<gallery[^>]*>[\s\S]*?<\/gallery>/gi, "");

  // 3. HTML tags
  r = r.replace(/<br\s*\/?>/gi, " ");
  r = r.replace(/<\/?tabber[^>]*>/gi, "");
  r = r.replace(/<[^>]+>/g, "");

  // 4. Tabber key separators: |-|Key= → remove
  r = r.replace(/\|-\|[^=]*=/g, " ");

  // 5. #tag:tabber
  r = r.replace(/\{\{#tag:tabber\|[\s\S]*?\}\}/gi, "");

  // 6. Resolve tier templates FIRST
  r = resolveTierTemplates(r);

  // 7. Strip remaining {{...}} templates (iterative for nesting)
  for (let i = 0; i < 8; i++) {
    const before = r;
    r = r.replace(/\{\{(?:[^{}]|\{[^{}]*\})*\}\}/g, "");
    if (r === before) break;
  }

  // 8. External links: [https://url text] → text
  r = r.replace(/\[https?:\/\/[^\s\]]+(?:\s+([^\]]+))?\]/g, "$1");

  // 9. Internal links: [[Page|Display]] → Display, [[Page]] → Page
  r = r.replace(/\[\[([^|\]#]+)(?:#[^|\]]+)?\|([^\]]+)\]\]/g, "$2");
  r = r.replace(/\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, "$1");

  // 10. Bold/italic
  r = r.replace(/'''/g, "");
  r = r.replace(/''/g, "");

  // 11. HTML entities
  r = r.replace(/&nbsp;/g, " ");
  r = r.replace(/&amp;/g, "&");
  r = r.replace(/&lt;/g, "<");
  r = r.replace(/&gt;/g, ">");

  // 12. Pipe artifacts
  r = r.replace(/^\s*\|\s*/, "");
  r = r.replace(/\s*\|\s*$/, "");

  // 13. Whitespace
  r = r.replace(/\s+/g, " ").trim();

  return r;
}

// ── Abilities Extractor ─────────────────────────────────────────────

function extractAbilities(wikitext: string): string[] {
  // Abilities are inside ==Powers and Stats== section, under '''Powers and Abilities:''' field
  // They're wrapped in nested templates but formatted as *'''[[Ability Name]]''' bullets
  const statsSection = extractSection(wikitext, "Powers and Stats") ?? "";
  
  // Extract ONLY the Powers and Abilities sub-section (before Tier/Key)
  const paSection = statsSection.match(/'''Powers and Abilities:'''([\s\S]*?)(?=\n'''(?:\[\[)?(?:Tiering|Key|Attack|Speed|Durability))/i)?.[1] ?? "";
  
  const abilities: string[] = [];
  // Filter: skip Media links, character references, descriptions
  const isJunk = (target: string, display: string) => {
    if (/^media:/i.test(target)) return true; // image links
    if (/\(.*\)/.test(target) && !/\(Dragon Ball\)/i.test(target)) return true; // character refs like "Android 17 (Manga)" but NOT "Ki Manipulation (Dragon Ball)"
    if (/^Gas\b|^Pirate\b|^Android\b/i.test(target)) return true; // character names
    if (display.length > 40) return true; // descriptions
    if (/'s$/.test(display)) return true; // possessive fragments
    if (/-$/.test(display)) return true; // partial words
    if (/^from |^being |^later |^can |^the /i.test(display)) return true; // sentence fragments
    return false;
  };
  
  // Pattern: *'''[[Link|Display]]''' or *'''[[Link]]''' (bullet abilities)
  const bulletPattern = /\*+[^*\n]*?\[\[([^|\]#]+)(?:#[^|\]]+)?\|([^\]]+)\]\]/g;
  let m;
  while ((m = bulletPattern.exec(paSection)) !== null) {
    const target = m[1].trim();
    const display = m[2].trim();
    // Skip if target is Media/File/etc, or display looks like a description
    if (isJunk(target, display)) continue;
    if (display.length < 3 || display.length > 50) continue;
    if (/^\d+$/.test(display)) continue; // pure numbers
    abilities.push(display);
  }
  
  // Pattern 2: *'''[[Link]]''' without display text
  if (abilities.length < 5) {
    const bulletPattern2 = /\*+[^*\n]*?\[\[([^\]|#]+)\]\]/g;
    while ((m = bulletPattern2.exec(paSection)) !== null) {
      const name = m[1].trim();
      if (isJunk(name, name)) continue;
      if (name.length < 3 || name.length > 50) continue;
      abilities.push(name);
    }
  }

  return unique(abilities).slice(0, 30);
}

// ── Section Extractor ───────────────────────────────────────────────

function extractSection(wikitext: string, title: string): string | undefined {
  const pattern = new RegExp(
    `==+\\s*${escapeRegex(title)}\\s*==+([\\s\\S]*?)(?:\\n==+\\s*[^=]+\\s*==+|$)`,
    "i"
  );
  return wikitext.match(pattern)?.[1]?.trim();
}

// ── Utilities ───────────────────────────────────────────────────────

function splitList(value: string): string[] {
  // Split by newlines, semicolons, or pipe (which separates key versions in wiki)
  // Weaknesses are usually one long paragraph — split by pipe as key separator
  return unique(
    value
      .split(/\n|;|\|/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && s.length < 1000)
  );
}

function inferSeries(categories: string[], links: string[]): string {
  const cat = categories.find((c) => /characters|protagonists|antagonists/i.test(c));
  if (cat) return cat.replace(/^Category:/, "").replace(/ characters$/i, "");
  return links.find((l) => !/category|template|file/i.test(l)) ?? "Unknown";
}

function cleanName(pageTitle: string): string {
  return decodeURIComponent(pageTitle).replace(/_/g, " ");
}

function wikiUrl(title: string): string {
  return `${WIKI_BASE}${encodeURIComponent(title.replace(/\s+/g, "_"))}`;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function slugify(value: string): string {
  return cleanName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wikiHeaders() {
  return {
    "User-Agent": "VSBattleAI/0.1 (https://vsbattle.ai; educational matchup analysis)"
  };
}
