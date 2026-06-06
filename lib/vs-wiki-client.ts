import { fallbackFeats, fallbackSearch, getFallbackCharacter } from "./mock-data";
import type { CharacterProfile, Feat, SearchResult, SourceLink } from "./types";

const API_BASE = "https://vsbattles.fandom.com/api.php";
const WIKI_BASE = "https://vsbattles.fandom.com/wiki/";

type SearchApiResponse = {
  query?: {
    search?: Array<{
      title: string;
      snippet?: string;
    }>;
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
          slots?: {
            main?: {
              "*": string;
            };
          };
          "*": string;
        }>;
        thumbnail?: {
          source?: string;
        };
        original?: {
          source?: string;
        };
        categories?: Array<{ title: string }>;
        links?: Array<{ title: string }>;
      }
    >;
  };
};

export async function searchCharacters(query: string): Promise<SearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return [];
  }

  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: cleanQuery,
    srlimit: "8",
    format: "json",
    origin: "*"
  });

  try {
    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: wikiHeaders(),
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`VS Wiki search failed: ${response.status}`);
    }

    const data = (await response.json()) as SearchApiResponse;
    const results = data.query?.search ?? [];

    return results.map((result) => ({
      title: result.title,
      snippet: stripHtml(result.snippet ?? ""),
      url: wikiUrl(result.title)
    }));
  } catch {
    return fallbackSearch(cleanQuery);
  }
}

export async function getCharacterProfile(
  pageTitle: string
): Promise<CharacterProfile> {
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
    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: wikiHeaders(),
      next: { revalidate: 86400 }
    });

    if (!response.ok) {
      throw new Error(`Profil VS Wiki gagal dimuat: ${response.status}`);
    }

    const data = (await response.json()) as PageApiResponse;
    const page = Object.values(data.query?.pages ?? {})[0];
    const content =
      page?.revisions?.[0]?.slots?.main?.["*"] ??
      page?.revisions?.[0]?.["*"] ??
      "";

    if (!page?.title || !content) {
      if (fallback) {
        return fallback;
      }

      return profileFromUnknown(normalizedTitle);
    }

    return parseProfile({
      pageTitle: page.title,
      wikitext: content,
      imageUrl: page.original?.source ?? page.thumbnail?.source,
      categories: page.categories?.map((category) => category.title) ?? [],
      links: page.links?.map((link) => link.title) ?? []
    });
  } catch {
    if (fallback) {
      return fallback;
    }

    return profileFromUnknown(normalizedTitle);
  }
}

export async function getCharacterFeats(
  pageTitle: string
): Promise<Feat[]> {
  const profile = await getCharacterProfile(pageTitle);
  return featsFromProfile(profile);
}

export function featsFromProfile(profile: CharacterProfile): Feat[] {
  const feats: Feat[] = [
    {
      id: `${profile.id}-attack-potency`,
      category: "Strength",
      title: "Rating Attack Potency",
      description: profile.attackPotency,
      source: profile.sourceLinks[0],
      confidence: profile.attackPotency === "Unknown" ? "low" : "medium"
    },
    {
      id: `${profile.id}-speed`,
      category: "Speed",
      title: "Rating Speed",
      description: profile.speed,
      source: profile.sourceLinks[0],
      confidence: profile.speed === "Unknown" ? "low" : "medium"
    },
    {
      id: `${profile.id}-durability`,
      category: "Durability",
      title: "Rating Durability",
      description: profile.durability,
      source: profile.sourceLinks[0],
      confidence: profile.durability === "Unknown" ? "low" : "medium"
    }
  ];

  const hax = profile.abilities.filter((ability) =>
    /time|reality|existence|mind|soul|causality|fate|concept|regeneration/i.test(
      ability
    )
  );

  hax.slice(0, 5).forEach((ability, index) => {
    feats.push({
      id: `${profile.id}-hax-${index}`,
      category: "Hax",
      title: ability,
      description: `${profile.shortName} punya ${ability}. Cek mekanik dan batasannya dari profil sebelum dipakai sebagai win condition.`,
      source: profile.sourceLinks[0],
      confidence: "medium"
    });
  });

  const fallback = fallbackFeats(profile);
  return feats.length ? feats : fallback;
}

function parseProfile(input: {
  pageTitle: string;
  wikitext: string;
  imageUrl?: string;
  categories: string[];
  links: string[];
}): CharacterProfile {
  const stats = {
    tier: readField(input.wikitext, ["Tier"]) ?? "Unknown",
    attackPotency:
      readField(input.wikitext, ["Attack Potency", "Attack potency"]) ??
      "Unknown",
    speed: readField(input.wikitext, ["Speed"]) ?? "Unknown",
    durability: readField(input.wikitext, ["Durability"]) ?? "Unknown",
    intelligence: readField(input.wikitext, ["Intelligence"]) ?? "Unknown",
    weakness: readField(input.wikitext, ["Weaknesses", "Weakness"]) ?? ""
  };

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
    series:
      readField(input.wikitext, ["Verse", "Origin"]) ??
      inferSeries(input.categories, input.links),
    tier: cleanWikiText(stats.tier),
    attackPotency: cleanWikiText(stats.attackPotency),
    speed: cleanWikiText(stats.speed),
    durability: cleanWikiText(stats.durability),
    intelligence: cleanWikiText(stats.intelligence),
    abilities: extractAbilities(input.wikitext),
    weaknesses: splitList(cleanWikiText(stats.weakness)),
    keys: splitList(readField(input.wikitext, ["Key", "Keys"]) ?? ""),
    imageUrl: input.imageUrl,
    wikiUrl: wikiUrl(input.pageTitle),
    rawStats: {
      tier: stats.tier,
      attackPotency: stats.attackPotency,
      speed: stats.speed,
      durability: stats.durability,
      intelligence: stats.intelligence,
      weakness: stats.weakness
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
    sourceLinks: [
      {
        label: "Profil VS Battles Wiki",
        url: wikiUrl(pageTitle),
        type: "profile"
      }
    ],
    cached: false,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

function readField(wikitext: string, names: string[]): string | undefined {
  for (const name of names) {
    const patterns = [
      new RegExp(`'''\\s*${escapeRegex(name)}\\s*:?\\s*'''\\s*:?\\s*([^\\n]+)`, "i"),
      new RegExp(`\\|\\s*${escapeRegex(name)}\\s*=\\s*([^\\n]+)`, "i"),
      new RegExp(`${escapeRegex(name)}\\s*:?\\s*([^\\n]+)`, "i")
    ];

    for (const pattern of patterns) {
      const match = wikitext.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  return undefined;
}

function extractAbilities(wikitext: string): string[] {
  const section =
    extractSection(wikitext, "Powers and Abilities") ??
    readField(wikitext, ["Powers and Abilities", "Abilities"]) ??
    "";

  const linkMatches = [...section.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g)];
  const linkedAbilities = linkMatches
    .map((match) => cleanWikiText(match[2] ?? match[1]))
    .filter(Boolean)
    .filter((ability) => ability.length <= 52);

  if (linkedAbilities.length) {
    return unique(linkedAbilities).slice(0, 30);
  }

  return splitList(cleanWikiText(section)).slice(0, 30);
}

function extractSection(wikitext: string, title: string): string | undefined {
  const pattern = new RegExp(
    `==+\\s*${escapeRegex(title)}\\s*==+([\\s\\S]*?)(?:\\n==+\\s*[^=]+\\s*==+|$)`,
    "i"
  );
  return wikitext.match(pattern)?.[1]?.trim();
}

function cleanWikiText(value: string): string {
  return value
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref[^/]*\/>/gi, "")
    .replace(/<br\s*\/?>/gi, "; ")
    .replace(/\{\{(?:[^{}]|\{[^{}]*\})*\}\}/g, "")
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, "$1")
    .replace(/'''/g, "")
    .replace(/''/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitList(value: string): string[] {
  return unique(
    value
      .split(/;|,|\n|\*/)
      .map((item) => item.trim())
      .filter((item) => item.length > 1 && item.length < 90)
  );
}

function inferSeries(categories: string[], links: string[]): string {
  const category = categories.find((item) =>
    /characters|protagonists|antagonists/i.test(item)
  );

  if (category) {
    return category.replace(/^Category:/, "").replace(/ characters$/i, "");
  }

  return links.find((link) => !/category|template|file/i.test(link)) ?? "Unknown";
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
  return [...new Set(values)];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wikiHeaders() {
  return {
    "User-Agent": "VSBattleAI/0.1 (https://vsbattle.ai; educational matchup analysis)"
  };
}
