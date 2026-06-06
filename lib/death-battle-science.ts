/**
 * Death Battle Science — Physics & Feat Calculation Knowledge
 *
 * Real-world physics used by Death Battle to quantify fictional feats.
 * This is the CORE of what separates Death Battle from generic power scaling.
 */

export const PHYSICS_FORMULAS = {
  kinetic_energy: {
    formula: "KE = ½ × m × v²",
    description: "Energy of a moving object. Mass in kg, velocity in m/s, result in Joules.",
    example: "A 80 kg person moving at speed of light: KE = ½ × 80 × (3×10⁸)² = 3.6×10¹⁸ J",
  },
  gravitational_binding_energy: {
    formula: "GBE = (3 × G × M²) / (5 × R)",
    description: "Energy needed to completely destroy a celestial body. G = 6.674×10⁻¹¹, M = mass (kg), R = radius (m).",
    example: "Earth GBE ≈ 2.49×10³² J (about 59.6 zettatons of TNT)",
  },
  explosion_yield: {
    formula: "E = (R³ × P) / (t³ × ρ)",
    description: "Estimate explosion energy from fireball radius. Simplified: 1 megaton TNT ≈ 1 km fireball radius.",
    example: "A visible explosion with 10 km radius ≈ 1000 megatons = 1 gigaton TNT",
  },
  force: {
    formula: "F = m × a",
    description: "Force = mass × acceleration. Used for striking strength and lifting feats.",
    example: "Punching a 100 kg object to Mach 10 in 0.1s: F = 100 × 3430 / 0.1 = 3,430,000 N",
  },
  speed_calc: {
    formula: "v = d / t",
    description: "Speed = distance / time. Cross-reference with known distances (planet diameters, orbital distances).",
    example: "Crossing Earth diameter (12,742 km) in 1 second = 12,742,000 m/s ≈ Mach 37,149",
  },
  lifting_strength: {
    formula: "F = m × g (for weight on planet surface)",
    description: "Lifting strength from feats. Earth g = 9.81 m/s². Planet mass gives g via g = GM/R².",
    example: "Lifting a mountain (10¹² kg) on Earth: F = 10¹² × 9.81 ≈ 9.81×10¹² N ≈ 10¹² kgf",
  },
  angular_size: {
    formula: "θ = 2 × arctan(d / (2×D))",
    description: "Used to estimate size of objects in panels. θ = angular size, d = object size, D = distance.",
    example: "If a character is 10 pixels tall and the panel is 400px wide, estimated distance ≈ known width × 400 / (10 × 2 × tan(30°))",
  },
} as const;

export const ENERGY_UNITS = {
  joule: { symbol: "J", joules: 1, description: "SI unit of energy" },
  kilojoule: { symbol: "kJ", joules: 1e3, description: "1,000 joules" },
  megajoule: { symbol: "MJ", joules: 1e6, description: "1 million joules" },
  gigajoule: { symbol: "GJ", joules: 1e9, description: "1 billion joules" },
  ton_tnt: { symbol: "tTNT", joules: 4.184e9, description: "1 ton of TNT = 4.184 billion joules" },
  kiloton_tnt: { symbol: "ktTNT", joules: 4.184e12, description: "1 kiloton TNT = 1,000 tons TNT" },
  megaton_tnt: { symbol: "MtTNT", joules: 4.184e15, description: "1 megaton TNT = 1 million tons TNT" },
  gigaton_tnt: { symbol: "GtTNT", joules: 4.184e18, description: "1 gigaton TNT = 1 billion tons TNT" },
  foe: { symbol: "foe", joules: 1e44, description: "10⁴⁴ joules — typical supernova energy" },
  // Celestial destruction thresholds
  moon_gbe: { symbol: "Moon GBE", joules: 1.24e29, description: "Energy to destroy Earth's Moon" },
  earth_gbe: { symbol: "Earth GBE", joules: 2.49e32, description: "Energy to destroy Earth" },
  sun_gbe: { symbol: "Sun GBE", joules: 6.87e41, description: "Energy to destroy the Sun" },
} as const;

export const SPEED_TIERS = {
  // m/s values for speed classification
  subsonic: { mps: 34.3, label: "Subsonic", description: "< Mach 0.1" },
  transonic: { mps: 286, label: "Transonic", description: "~ Mach 0.8-0.9" },
  supersonic: { mps: 686, label: "Supersonic", description: "Mach 2" },
  hypersonic: { mps: 1715, label: "Hypersonic", description: "Mach 5" },
  high_hypersonic: { mps: 8575, label: "High Hypersonic", description: "Mach 25" },
  massively_hypersonic: { mps: 34300, label: "Massively Hypersonic", description: "Mach 100" },
  sub_relativistic: { mps: 29979245, label: "Sub-Relativistic", description: "10% speed of light" },
  relativistic: { mps: 149896229, label: "Relativistic", description: "50% speed of light" },
  ftl: { mps: 299792458, label: "FTL", description: "Speed of light (c)" },
  ftl_plus: { mps: 2997924580, label: "FTL+", description: "10× speed of light" },
  mftl_plus: { mps: 29979245800, label: "Massively FTL+", description: "100×+ speed of light" },
} as const;

export const PHYSICAL_CONSTANTS = {
  speed_of_light: 299792458, // m/s
  mach_1: 343, // m/s (at sea level, 20°C)
  earth_mass: 5.972e24, // kg
  earth_radius: 6371000, // m
  moon_mass: 7.342e22, // kg
  moon_radius: 1737400, // m
  sun_mass: 1.989e30, // kg
  sun_radius: 696340000, // m
  gravitational_constant: 6.674e-11, // m³/(kg·s²)
  standard_gravity: 9.81, // m/s²
} as const;

/**
 * Common feat calculations Death Battle uses.
 * These are pre-calculated reference points for the AI.
 */
export const REFERENCE_FEATS = {
  // Destruction feats
  destroy_wall: { energy_joules: 1e6, description: "Destroy a concrete wall ≈ 1 MJ" },
  destroy_building: { energy_joules: 2.092e12, description: "Destroy a building ≈ 0.5 kilotons TNT" },
  destroy_city_block: { energy_joules: 4.184e13, description: "City block destruction ≈ 10 kilotons TNT" },
  destroy_city: { energy_joules: 4.184e15, description: "Destroy a city ≈ 1 megaton TNT" },
  destroy_island: { energy_joules: 4.184e18, description: "Destroy an island ≈ 1 gigaton TNT" },
  destroy_country: { energy_joules: 4.184e21, description: "Country destruction ≈ 1 teraton TNT" },
  destroy_continent: { energy_joules: 4.184e24, description: "Continent destruction ≈ 1 petaton TNT" },
  destroy_planet: { energy_joules: 2.49e32, description: "Planet destruction ≈ Earth GBE ≈ 59.6 zettatons TNT" },
  destroy_star: { energy_joules: 6.87e41, description: "Star destruction ≈ Sun GBE" },
  destroy_solar_system: { energy_joules: 1e44, description: "Solar system destruction ≈ 1 foe" },
  destroy_galaxy: { energy_joules: 1e53, description: "Galaxy destruction" },
  destroy_universe: { energy_joules: 4e69, description: "Observable universe GBE" },

  // Speed feats
  dodge_bullet: { speed_mps: 343, description: "Dodge a bullet ≈ Mach 1" },
  lightning_timer: { speed_mps: 440000, description: "React to lightning ≈ Mach 1283" },
  light_speed_reaction: { speed_mps: 299792458, description: "React to light ≈ FTL" },
  cross_earth: { speed_mps: 12742000, description: "Cross Earth in 1 second ≈ Mach 37,149" },
  cross_solar_system: { speed_mps: 7.5e12, description: "Cross solar system (Neptune orbit) in 1 hour" },

  // Lifting feats
  lift_car: { force_newtons: 19620, description: "Lift a car (2 tons) ≈ 19,620 N" },
  lift_train: { force_newtons: 981000, description: "Lift a train (100 tons) ≈ 981,000 N" },
  lift_mountain: { force_newtons: 9.81e12, description: "Lift a mountain (10⁹ tons) ≈ 9.81×10¹² N" },
  lift_island: { force_newtons: 9.81e16, description: "Lift an island (10¹³ tons) ≈ 9.81×10¹⁶ N" },
} as const;

/**
 * How Death Battle evaluates feats scientifically.
 * This methodology is critical for the AI to follow.
 */
export const FEAT_METHODOLOGY = `
## Death Battle Feat Analysis Methodology

Death Battle does NOT just compare who "seems stronger." They use real physics:

### Step 1: Identify the Feat
- Find a specific, measurable action from the character's history
- Prefer ON-PANEL feats (shown happening) over statements
- Use the character's BEST CONSISTENT feats, not outliers
- If a feat is contradicted by anti-feats, note the contradiction

### Step 2: Quantify with Physics
- Convert the feat to measurable units (Joules, m/s, Newtons)
- Use conservative estimates when exact values aren't given
- Apply the appropriate formula:
  - Destruction → Energy (Joules, tons TNT)
  - Speed → Distance/Time (m/s, Mach, ×c)
  - Lifting → Force (Newtons)
  - Durability → Survived X energy = at least X durability

### Step 3: Compare Across Categories
- Tier gap matters most: if one character is Planet level and the other is City level, that's a MASSIVE gap
- Speed gap: can the slower character even HIT the faster one?
- Hax: can abilities bypass stat advantages? (e.g., durability negation, time stop)
- Stamina: who can fight longer?

### Step 4: Apply Death Battle Rules
- Both characters at their peak accepted version
- No outside help (armies, allies, power-ups from others)
- No BFR unless it's a standard ability
- Both in-character (unless specified as bloodlusted)
- Feats > statements > scaling (in that order)

### Step 5: Determine Winner
- If one character outscales in EVERY category → stomp
- If stats are close → hax, intelligence, experience become deciding factors
- If one stat is massively higher but others are close → the dominant stat usually wins
- Tier gap of 2+ is almost always a stomp unless extreme hax difference
`.trim();

/**
 * Common scientific reasoning patterns Death Battle uses.
 * The AI should apply these when analyzing feats.
 */
export const SCIENTIFIC_REASONING = [
  "Destruction of a physical object requires overcoming its structural integrity AND gravitational binding energy.",
  "Speed feats require both reaction time AND movement speed — a character can react to light but not move at light speed.",
  "Durability is not just 'tanking hits' — it includes resistance to temperature, pressure, radiation, and hax.",
  "Lifting strength ≠ striking strength. A character can lift a mountain but not punch with mountain-level force.",
  "Energy output scales with volume for area attacks, but with mass for physical attacks.",
  "A character who destroys a planet by charging up for 5 minutes is NOT planet-level in combat speed.",
  "Statements from unreliable narrators (characters who are wrong, boastful, or lack knowledge) are weighted lower.",
  "Consistent feats across multiple showings are more reliable than a single extreme feat.",
  "Cross-scaling: if Character A beats Character B who is confirmed Planet level, then A is at least Planet level.",
  "Hax resistance: if a character has resisted a specific hax before, they have resistance to that hax type.",
] as const;
