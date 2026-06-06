import type { CharacterProfile, Feat, SearchResult } from "./types";

const now = new Date().toISOString();

export const fallbackCharacters: CharacterProfile[] = [
  {
    id: "goku",
    pageTitle: "Son Goku (Dragon Ball Super)",
    name: "Son Goku",
    shortName: "Goku",
    series: "Dragon Ball",
    tier: "Low 2-C",
    attackPotency: "Universe level+ with Ultra Instinct scaling",
    speed: "Massively FTL+",
    durability: "Universe level+",
    intelligence: "Gifted combat intelligence",
    abilities: [
      "Ki Manipulation",
      "Ultra Instinct",
      "Flight",
      "Teleportation",
      "Reactive Power Level"
    ],
    weaknesses: [
      "Can be overconfident",
      "Transformations consume stamina",
      "Not always serious at the start"
    ],
    keys: ["Dragon Ball Super", "Ultra Instinct"],
    imageUrl:
      "https://static.wikia.nocookie.net/vsbattles/images/7/75/Goku_DBZ_Episode_291.png",
    wikiUrl:
      "https://vsbattles.fandom.com/wiki/Son_Goku_(Dragon_Ball_Super)",
    rawStats: {},
    sourceLinks: [
      {
        label: "Profil VS Battles Wiki",
        url: "https://vsbattles.fandom.com/wiki/Son_Goku_(Dragon_Ball_Super)",
        type: "profile"
      }
    ],
    cached: true,
    cachedAt: now,
    expiresAt: now
  },
  {
    id: "saitama",
    pageTitle: "Saitama",
    name: "Saitama",
    shortName: "Saitama",
    series: "One-Punch Man",
    tier: "4-A, possibly 3-C",
    attackPotency: "Multi-Solar System level, possibly Galaxy level",
    speed: "Massively FTL+",
    durability: "Multi-Solar System level, possibly Galaxy level",
    intelligence: "Average, very skilled brawler",
    abilities: [
      "Accelerated Development",
      "Reactive Power Level",
      "Immense Strength",
      "Afterimage Creation"
    ],
    weaknesses: [
      "Usually starts casually",
      "Growth needs combat time",
      "Limited exotic hax resistance shown"
    ],
    keys: ["Current"],
    imageUrl:
      "https://static.wikia.nocookie.net/vsbattles/images/9/9b/Saitama_Profile.png",
    wikiUrl: "https://vsbattles.fandom.com/wiki/Saitama",
    rawStats: {},
    sourceLinks: [
      {
        label: "Profil VS Battles Wiki",
        url: "https://vsbattles.fandom.com/wiki/Saitama",
        type: "profile"
      }
    ],
    cached: true,
    cachedAt: now,
    expiresAt: now
  },
  {
    id: "superman",
    pageTitle: "Superman (Post-Crisis)",
    name: "Superman",
    shortName: "Superman",
    series: "DC Comics",
    tier: "4-B, higher with sun-dip",
    attackPotency: "Solar System level, higher with amps",
    speed: "Massively FTL+",
    durability: "Solar System level, higher with amps",
    intelligence: "Genius-level intellect",
    abilities: [
      "Flight",
      "Heat Vision",
      "Enhanced Senses",
      "Regeneration",
      "Resistance to Mind Manipulation"
    ],
    weaknesses: ["Kryptonite", "Magic", "Red sun radiation"],
    keys: ["Post-Crisis"],
    wikiUrl: "https://vsbattles.fandom.com/wiki/Superman_(Post-Crisis)",
    rawStats: {},
    sourceLinks: [
      {
        label: "Profil VS Battles Wiki",
        url: "https://vsbattles.fandom.com/wiki/Superman_(Post-Crisis)",
        type: "profile"
      }
    ],
    cached: true,
    cachedAt: now,
    expiresAt: now
  },
  {
    id: "naruto",
    pageTitle: "Naruto Uzumaki (New Era)",
    name: "Naruto Uzumaki",
    shortName: "Naruto",
    series: "Naruto",
    tier: "5-B",
    attackPotency: "Planet level with strongest forms",
    speed: "Relativistic+ to FTL",
    durability: "Planet level with chakra cloaks",
    intelligence: "Skilled tactician in combat",
    abilities: [
      "Chakra Manipulation",
      "Shadow Clone Technique",
      "Sage Mode",
      "Regeneration",
      "Extrasensory Perception"
    ],
    weaknesses: ["Stamina limits", "Can be emotionally baited"],
    keys: ["New Era", "Six Paths Sage Mode"],
    wikiUrl: "https://vsbattles.fandom.com/wiki/Naruto_Uzumaki_(New_Era)",
    rawStats: {},
    sourceLinks: [
      {
        label: "Profil VS Battles Wiki",
        url: "https://vsbattles.fandom.com/wiki/Naruto_Uzumaki_(New_Era)",
        type: "profile"
      }
    ],
    cached: true,
    cachedAt: now,
    expiresAt: now
  }
];

export function fallbackSearch(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  return fallbackCharacters
    .filter((character) => {
      return (
        character.name.toLowerCase().includes(q) ||
        character.pageTitle.toLowerCase().includes(q) ||
        character.series.toLowerCase().includes(q)
      );
    })
    .map((character) => ({
      title: character.pageTitle,
      snippet: `${character.name} from ${character.series}. Tier ${character.tier}.`,
      url: character.wikiUrl
    }));
}

export function getFallbackCharacter(name: string): CharacterProfile | undefined {
  const normalized = decodeURIComponent(name).replace(/_/g, " ").toLowerCase();
  return fallbackCharacters.find((character) => {
    return (
      character.id === normalized ||
      character.name.toLowerCase() === normalized ||
      character.shortName.toLowerCase() === normalized ||
      character.pageTitle.toLowerCase() === normalized
    );
  });
}

export function fallbackFeats(profile: CharacterProfile): Feat[] {
  const source = profile.sourceLinks[0];
  return [
    {
      id: `${profile.id}-ap`,
      category: "Strength",
      title: `Attack Potency ${profile.shortName}`,
      description: profile.attackPotency,
      source,
      confidence: profile.attackPotency === "Unknown" ? "low" : "medium"
    },
    {
      id: `${profile.id}-speed`,
      category: "Speed",
      title: `Speed tempur ${profile.shortName}`,
      description: profile.speed,
      source,
      confidence: profile.speed === "Unknown" ? "low" : "medium"
    },
    {
      id: `${profile.id}-durability`,
      category: "Durability",
      title: `Durability ${profile.shortName}`,
      description: profile.durability,
      source,
      confidence: profile.durability === "Unknown" ? "low" : "medium"
    }
  ];
}
