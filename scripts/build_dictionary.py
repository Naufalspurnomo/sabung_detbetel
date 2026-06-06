#!/usr/bin/env python3
"""Build final knowledge dictionary from parsed data. Output: knowledge_dictionary.json"""
import json
import os
import re

BASE_DIR = "/root/sabung_detbetel/data/knowledge"

def clean_summary(text: str) -> str:
    """Fix summary artifacts."""
    text = re.sub(r'\([\w\s]+\)\s*(?:survives|using|demonstrating|showing)[^\n]*', '', text)
    text = re.sub(r'^\s*\[\[.*?\]\]\s*', '', text)
    text = re.sub(r'^\s*\([\w\s]+\)\s*', '', text)
    text = re.sub(r'^\s*\n+', '', text)
    text = re.sub(r'^\([\w\s:]+\)\s+', '', text)
    text = re.sub(r"'{2,}", '', text)
    # Remove leftover wiki markup
    text = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)
    text = re.sub(r'\{\{[^}]*\}\}', '', text)
    text = re.sub(r'\[https?://[^\s\]]+\s*([^\]]*)\]', r'\1', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\n{2,}', '\n', text)
    return text.strip()

def clean_wikitext(text: str) -> str:
    """Strip all wiki markup from text."""
    text = re.sub(r"'{2,}", '', text)
    text = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)
    text = re.sub(r'\{\{(?:Border|Tabber|!)\|[^}]*\}\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\{\{[^}]*\}\}', '', text)
    text = re.sub(r'\[https?://[^\s\]]+\s*([^\]]*)\]', r'\1', text)
    text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.DOTALL)
    text = re.sub(r'<ref[^>]*/>', '', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def build_dictionary():
    """Build the final knowledge dictionary."""
    with open(os.path.join(BASE_DIR, 'knowledge_parsed.json')) as f:
        kb = json.load(f)
    
    # Load tiering system raw
    tiering_path = os.path.join(BASE_DIR, 'vsbattles', 'tiering_system_raw.txt')
    tiering_raw = ''
    if os.path.exists(tiering_path):
        with open(tiering_path) as f:
            tiering_raw = f.read()
    
    dictionary = {
        'meta': {
            'version': '2.0',
            'source': 'VS Battles Wiki + Death Battle Wiki',
            'total_entries': 0,
            'categories': ['tiers', 'powers', 'stats', 'glossary', 'rules']
        },
        'tiers': {},
        'powers': {},
        'stats': {},
        'glossary': {},
        'rules': {},
        'aliases': {}
    }
    
    # ═══════════════════════════════════════════
    # 1. TIERING SYSTEM — all 53 tiers
    # ═══════════════════════════════════════════
    if tiering_raw:
        tier_pattern = r'====.*?Tier\s+([^|]+)\|([^\]]+)\]\].*?====\s*\n(.*?)(?=\n====|\n===|\Z)'
        for m in re.finditer(tier_pattern, tiering_raw, re.DOTALL):
            tier_id = m.group(1).strip()
            tier_name_raw = m.group(2).strip()
            # tier_name_raw may include ": Name" after ]]
            full_line = m.group(0).split('\n')[0]
            # Extract the part after ]]:
            after_bracket = re.sub(r'^.*\]\]', '', full_line).strip().lstrip(':').strip().rstrip('=').strip()
            tier_name = after_bracket if after_bracket else tier_name_raw
            
            tier_desc = clean_wikitext(m.group(3))
            
            if tier_desc:
                dictionary['tiers'][tier_id] = {
                    'name': tier_name,
                    'description': tier_desc[:2000],
                    'tier_id': tier_id
                }
                dictionary['aliases'][tier_id.lower()] = f'tiers.{tier_id}'
                dictionary['aliases'][tier_name.lower()] = f'tiers.{tier_id}'
                # Add common aliases
                dictionary['aliases'][f'tier {tier_id}'.lower()] = f'tiers.{tier_id}'
    
    # ═══════════════════════════════════════════
    # 2. POWERS & ABILITIES — 227 entries
    # ═══════════════════════════════════════════
    for page in kb.get('powers', []):
        title = page['title']
        summary = clean_summary(page.get('summary', ''))
        
        if not summary or len(summary) < 20:
            continue
        if title.startswith('Category:'):
            continue
        
        entry = {
            'title': title,
            'summary': summary[:3000],
            'types': page.get('types', []),
            'uses': page.get('uses', []),
            'notes': clean_summary(page.get('notes', ''))[:1500] if page.get('notes') else '',
        }
        
        dictionary['powers'][title] = entry
        dictionary['aliases'][title.lower()] = f'powers.{title}'
        
        # Type aliases
        for t in entry.get('types', []):
            type_key = f"Type {t['type']}: {t['name']}"
            dictionary['aliases'][type_key.lower()] = f'powers.{title}.types.{t["type"]}'
    
    # ═══════════════════════════════════════════
    # 3. STATS — 11 stat definition pages
    # ═══════════════════════════════════════════
    for page in kb.get('stats', []):
        title = page['title']
        summary = clean_summary(page.get('summary', ''))
        tier_defs = page.get('tier_definitions', [])
        
        # Clean tier defs
        cleaned_defs = []
        for td in tier_defs:
            if isinstance(td, dict):
                cleaned_defs.append({
                    'name': td.get('name', ''),
                    'tier': td.get('tier', ''),
                    'description': clean_wikitext(td.get('description', ''))[:1000]
                })
        
        entry = {
            'title': title,
            'summary': summary[:3000],
            'tier_definitions': cleaned_defs
        }
        
        dictionary['stats'][title] = entry
        dictionary['aliases'][title.lower()] = f'stats.{title}'
    
    # ═══════════════════════════════════════════
    # 4. GLOSSARY — 10 terms
    # ═══════════════════════════════════════════
    for page in kb.get('glossary', []):
        title = page['title']
        summary = clean_summary(page.get('summary', ''))
        
        entry = {
            'title': title,
            'summary': summary[:3000],
            'types': page.get('types', []),
        }
        
        dictionary['glossary'][title] = entry
        dictionary['aliases'][title.lower()] = f'glossary.{title}'
    
    # ═══════════════════════════════════════════
    # 5. VSBATTLES REFERENCE PAGES
    # ═══════════════════════════════════════════
    vsb_ref_dir = os.path.join(BASE_DIR, 'vsbattles')
    if os.path.isdir(vsb_ref_dir):
        for fname in os.listdir(vsb_ref_dir):
            if not fname.endswith('.json'):
                continue
            fpath = os.path.join(vsb_ref_dir, fname)
            with open(fpath) as f:
                raw = json.load(f)
            title = raw.get('title', fname.replace('.json', ''))
            wikitext = raw.get('wikitext', '')
            # Extract first 5000 chars as summary (these are reference articles)
            summary = clean_wikitext(wikitext[:8000])
            if summary and len(summary) > 30:
                dictionary['glossary'][title] = {
                    'title': title,
                    'summary': summary[:5000],
                    'types': [],
                }
                dictionary['aliases'][title.lower()] = f'glossary.{title}'
    
    # ═══════════════════════════════════════════
    # 6. DEATH BATTLE RULES & TERMINOLOGY
    # ═══════════════════════════════════════════
    dictionary['rules'] = {
        'standard_battle_assumptions': {
            'title': 'Standard Battle Assumptions (SBA)',
            'rules': [
                'Characters are in their standard/key forms unless specified otherwise',
                'Feats take precedence over character statements',
                'Outliers and Plot-Induced Stupidity (PIS) are not considered',
                'Both characters are aware of each other and the battle location',
                'Battle takes place in a neutral environment',
                'Both characters start at their standard power levels',
                'No outside help unless specified',
                'Speed is NOT equalized unless specified',
                'Morals are ON by default (characters act in-character)',
                'Bloodlust is OFF by default (characters do not fight to kill immediately)',
                'Prep time is 0 unless specified',
                'Victory is by death, KO, or incapacitation',
                'Both characters have access to their standard equipment',
                'Characters cannot use abilities they have not demonstrated',
                'Scaling must be supported by direct feats or reliable statements',
            ]
        },
        'tier_to_tier_gaps': {
            'title': 'Tier Gaps in VS Battles',
            'description': 'The difference between tiers is exponential, not linear. A character one tier higher has a MASSIVE advantage over a character one tier lower. The gap grows as tiers increase.',
            'gaps': {
                'Same Tier': 'Comparable power. Winner determined by skill, hax, and versatility.',
                '1 Tier Gap': 'Significant advantage. Higher tier character likely wins unless lower has strong hax.',
                '2+ Tier Gap': 'Overwhelming advantage. Higher tier character stomps unless extreme hax difference.',
                'Infinite Gap': 'Tier 3-A vs High 3-A = infinite difference. No amount of multiplier closes this.',
                'Uncountably Infinite Gap': 'Tier 2-C+ vs lower = dimensional transcendence. Cannot be overcome by any finite multiplier.'
            }
        },
        'difficulty_ratings': {
            'title': 'Difficulty Ratings',
            'ratings': {
                'Neg Diff': 'Victory with zero effort. Character doesn\'t even notice the opponent.',
                'No Diff': 'Victory with no effort at all.',
                'Low Diff': 'Victory with minimal effort. Slight exertion at most.',
                'Mid Diff': 'Victory with moderate effort. Some challenge but clear winner.',
                'High Diff': 'Victory requiring significant effort. Close fight.',
                'Extreme Diff': 'Victory barely achieved. Could have gone either way.',
                'Beyond Negative Diff': 'Hyperbolic expression for absolute stomp.'
            }
        },
        'key_terminology': {
            'title': 'Death Battle / VS Debate Key Terms',
            'terms': {
                'AP': 'Attack Potency - the destructive capacity of a character\'s attacks',
                'DC': 'Destructive Capacity - the area/volume of actual destruction caused',
                'Hax': 'Abilities that bypass conventional stats (durability negation, time stop, reality warping, etc.)',
                'BFR': 'Battlefield Removal - removing opponent from the battlefield instead of defeating them directly',
                'Blitz': 'Attacking faster than the opponent can react, often resulting in a one-hit victory',
                'Speed Blitz': 'Moving so fast the opponent cannot perceive or react to any attacks',
                'Stomp': 'A completely one-sided fight where one character has overwhelming advantage',
                'Spite': 'A matchup so one-sided it\'s considered unfair/harmful to the losing character',
                'Oneshot': 'Defeating opponent with a single attack',
                'Outlier': 'A feat that contradicts the character\'s established power level. Not considered valid.',
                'PIS': 'Plot-Induced Stupidity - when a character acts below their capability for plot purposes. Not considered valid.',
                'CIS': 'Character-Induced Stupidity - when a character acts below their capability due to personality. CAN be considered in-character analysis.',
                'Scaling': 'Determining a character\'s power by comparing to another character\'s known feats',
                'Feat': 'A demonstrated capability shown in the source material. Highest evidence tier.',
                'Statement': 'A claim about a character\'s power. Less reliable than feats unless supported.',
                'Calc': 'Calculation - mathematically determining the energy/output of a feat',
                'Prep Time': 'Time given to prepare before the battle',
                'Bloodlust': 'Character fights to kill with no moral restraints. Uses all abilities optimally.',
                'In-Character': 'Character behaves as they normally would in their story. May hold back or taunt.',
                'Morals Off': 'Character ignores their moral code and fights lethally from the start.',
                'Speed Equalized': 'Both characters fight at the same speed. Removes speed advantage to test other factors.',
                'Equalized': 'Stats are made equal to test skill/abilities rather than raw power.',
                'Composite': 'Using all versions/incarnations of a character combined into one.',
                'Canon': 'Only using officially published material from the source franchise.',
                'Chain Scaling': 'Scaling through multiple characters (A > B > C)',
                'Direct Scaling': 'Scaling from a direct comparison between two characters',
                'Tier': 'Classification of a character\'s overall power level',
                'Key': 'A specific version/form of a character with different stats (e.g., Goku has 6 keys)',
                'Via': 'By means of (used to specify how an ability works)',
                'Respect Thread': 'A compilation of a character\'s best feats from all sources',
                'VS Thread': 'A versus debate thread comparing two characters',
                'Matchup': 'A specific pairing of two characters for a Death Battle',
                'Verdict': 'The final conclusion of who wins and why',
                'Stat Advantage': 'When one character has higher stats in a specific category',
                'Hax Advantage': 'When one character has abilities that bypass the opponent\'s stats',
                'Win Condition': 'The specific scenario/ability that allows a character to win',
                'Loss Condition': 'The specific vulnerability/weakness that causes a character to lose',
                'Abilities Gap': 'When one character has significantly more useful abilities than the other',
                'Speed Gap': 'When one character is significantly faster, allowing them to control the fight',
                'Durability Negation': 'Abilities that bypass conventional durability (e.g., matter manipulation, soul attacks)',
                'Regeneration Negation': 'Abilities that prevent or bypass regeneration',
                'Immortality Negation': 'Abilities that can kill beings with various types of immortality',
                'Reality Warping': 'The ability to alter reality itself, often considered the most broken hax',
                'Time Manipulation': 'Abilities that control time (stop, slow, rewind, erase)',
                'Spatial Manipulation': 'Abilities that control space (teleportation, dimensional BFR)',
                'Causality Manipulation': 'Abilities that control cause and effect',
                'Conceptual Manipulation': 'Abilities that affect abstract concepts',
                'Information Manipulation': 'Abilities that control information at a fundamental level',
                'Soul Manipulation': 'Abilities that target the soul directly',
                'Mind Manipulation': 'Abilities that control or affect the mind',
                'Matter Manipulation': 'Abilities that control matter at atomic/subatomic level',
                'Energy Manipulation': 'Abilities that control various forms of energy',
                'Probability Manipulation': 'Abilities that alter the likelihood of events',
                'Fate/Destiny Manipulation': 'Abilities that control fate or predetermined outcomes',
                'Plot Manipulation': 'Abilities that control the narrative itself (highest tier hax)',
                'Acausality': 'Immunity to or existence outside normal cause-and-effect',
                'Nonexistent Physiology': 'Existing as nothing or beyond existence',
                'Beyond Dimensional Existence': 'Existing beyond dimensional frameworks entirely',
            }
        }
    }
    
    # ═══════════════════════════════════════════
    # 6. ADDITIONAL ALIASES for common terms
    # ═══════════════════════════════════════════
    extra_aliases = {
        'time stop': 'powers.Time_Stop',
        'timestop': 'powers.Time_Stop',
        'time manipulation': 'powers.Time_Manipulation',
        'reality warping': 'powers.Reality_Warping',
        'regen': 'powers.Regeneration',
        'regeneration': 'powers.Regeneration',
        'immortality': 'powers.Immortality',
        'immortal': 'powers.Immortality',
        'teleport': 'powers.Teleportation',
        'teleportation': 'powers.Teleportation',
        'flight': 'powers.Flight',
        'flying': 'powers.Flight',
        'durability negation': 'powers.Durability_Negation',
        'durability neg': 'powers.Durability_Negation',
        'dura neg': 'powers.Durability_Negation',
        'soul manipulation': 'powers.Soul_Manipulation',
        'soul hax': 'powers.Soul_Manipulation',
        'mind control': 'powers.Mind_Manipulation',
        'mind hax': 'powers.Mind_Manipulation',
        'existence erasure': 'powers.Existence_Erasure',
        'nonexistent': 'powers.Nonexistent_Physiology',
        'nonexistence': 'powers.Nonexistent_Physiology',
        'acausality': 'powers.Acausality',
        'acausal': 'powers.Acausality',
        'type 4 acausality': 'powers.Acausality.types.4',
        'fate manipulation': 'powers.Fate_Manipulation',
        'probability manipulation': 'powers.Probability_Manipulation',
        'matter manipulation': 'powers.Matter_Manipulation',
        'energy manipulation': 'powers.Energy_Manipulation',
        'spatial manipulation': 'powers.Spatial_Manipulation',
        'conceptual manipulation': 'powers.Conceptual_Manipulation',
        'information manipulation': 'powers.Information_Manipulation',
        'causality manipulation': 'powers.Causality_Manipulation',
        'plot manipulation': 'powers.Plot_Manipulation',
        'resistance': 'powers.Resistance',
        'forcefield': 'powers.Barrier_Creation',
        'barrier': 'powers.Barrier_Creation',
        'shield': 'powers.Barrier_Creation',
        'summoning': 'powers.Summoning',
        'transmutation': 'powers.Transmutation',
        'petrification': 'powers.Petrification',
        'absorption': 'powers.Absorption',
        'power nullification': 'powers.Power_Nullification',
        'power null': 'powers.Power_Nullification',
        'sealing': 'powers.Sealing',
        'bfr': 'powers.BFR',
        'battlefield removal': 'powers.BFR',
        'death manipulation': 'powers.Death_Manipulation',
        'biological manipulation': 'powers.Biological_Manipulation',
        'fire manipulation': 'powers.Fire_Manipulation',
        'ice manipulation': 'powers.Ice_Manipulation',
        'electricity manipulation': 'powers.Electricity_Manipulation',
        'water manipulation': 'powers.Water_Manipulation',
        'earth manipulation': 'powers.Earth_Manipulation',
        'light manipulation': 'powers.Light_Manipulation',
        'darkness manipulation': 'powers.Darkness_Manipulation',
        'sound manipulation': 'powers.Sound_Manipulation',
        'gravity manipulation': 'powers.Gravity_Manipulation',
        'creation': 'powers.Creation',
        'duplication': 'powers.Duplication',
        'shapeshifting': 'powers.Shapeshapeshifting',
        'size manipulation': 'powers.Size_Manipulation',
        'weapon mastery': 'powers.Weapon_Mastery',
        'martial arts': 'powers.Martial_Arts',
        'analytical prediction': 'powers.Analytical_Prediction',
        'precognition': 'powers.Precognition',
        'reactive evolution': 'powers.Reactive_Evolution',
        'adaptation': 'powers.Adaptation',
        'power mimicry': 'powers.Power_Mimicry',
        'absorption': 'powers.Absorption',
        'attack reflection': 'powers.Attack_Reflection',
        'reflection': 'powers.Attack_Reflection',
        'illusion': 'powers.Illusion_Creation',
        'invisibility': 'powers.Invisibility',
        'intangibility': 'powers.Intangibility',
        'invulnerability': 'powers.Invulnerability',
        'neg diff': 'rules.difficulty_ratings',
        'no diff': 'rules.difficulty_ratings',
        'low diff': 'rules.difficulty_ratings',
        'mid diff': 'rules.difficulty_ratings',
        'high diff': 'rules.difficulty_ratings',
        'extreme diff': 'rules.difficulty_ratings',
        'stomp': 'rules.key_terminology.terms.Stomp',
        'blitz': 'rules.key_terminology.terms.Blitz',
        'spite': 'rules.key_terminology.terms.Spite',
        'outlier': 'rules.key_terminology.terms.Outlier',
        'pis': 'rules.key_terminology.terms.PIS',
        'cis': 'rules.key_terminology.terms.CIS',
        'scaling': 'rules.key_terminology.terms.Scaling',
        'sba': 'rules.standard_battle_assumptions',
        'standard battle assumptions': 'rules.standard_battle_assumptions',
    }
    dictionary['aliases'].update(extra_aliases)
    
    # Update meta
    dictionary['meta']['total_entries'] = (
        len(dictionary['tiers']) + 
        len(dictionary['powers']) + 
        len(dictionary['stats']) + 
        len(dictionary['glossary']) +
        len(dictionary['rules'])
    )
    
    return dictionary


if __name__ == '__main__':
    print("Building knowledge dictionary v2...")
    dictionary = build_dictionary()
    
    out_path = os.path.join(BASE_DIR, 'knowledge_dictionary.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*50}")
    print(f"  Knowledge Dictionary v2.0")
    print(f"{'='*50}")
    print(f"  Tiers:    {len(dictionary['tiers']):>3}")
    print(f"  Powers:   {len(dictionary['powers']):>3}")
    print(f"  Stats:    {len(dictionary['stats']):>3}")
    print(f"  Glossary: {len(dictionary['glossary']):>3}")
    print(f"  Rules:    {len(dictionary['rules']):>3}")
    print(f"  Aliases:  {len(dictionary['aliases']):>3}")
    print(f"  Total:    {dictionary['meta']['total_entries']} entries")
    print(f"{'='*50}")
    
    size = os.path.getsize(out_path)
    print(f"  Size: {size:,} bytes ({size//1024} KB)")
    
    # Verify tiers
    print(f"\nSample tiers:")
    for tid in ['11-C', '9-C', '5-B', '4-B', '3-A', '2-C', '1-A', 'High 1-A']:
        if tid in dictionary['tiers']:
            t = dictionary['tiers'][tid]
            print(f"  {tid} ({t['name']}): {t['description'][:80]}...")
    
    # Verify powers
    print(f"\nSample powers:")
    for p in ['Acausality', 'Regeneration', 'Time_Stop', 'Reality_Warping']:
        if p in dictionary['powers']:
            print(f"  {p}: {dictionary['powers'][p]['summary'][:80]}...")
    
    # Verify aliases
    print(f"\nAlias lookups:")
    for a in ['blitz', 'time stop', 'acausality', 'sba', 'neg diff', 'regen']:
        if a in dictionary['aliases']:
            print(f"  '{a}' → {dictionary['aliases'][a]}")
