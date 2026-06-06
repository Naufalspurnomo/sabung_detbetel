#!/usr/bin/env python3
"""Parse raw VS Battles Wiki wikitext into clean structured JSON for AI knowledge base."""
import json
import os
import re
import sys

BASE_DIR = "/root/sabung_detbetel/data/knowledge"

def clean_wikitext(text: str) -> str:
    """Strip wiki markup, return clean text."""
    # Remove file/image embeds
    text = re.sub(r'\[\[File:[^\]]*\]\]', '', text)
    text = re.sub(r'\[\[Image:[^\]]*\]\]', '', text)
    # Convert [[Link|Display]] → Display
    text = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', text)
    # Convert [[Link]] → Link
    text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)
    # Convert [https://url Display] → Display
    text = re.sub(r'\[https?://[^\s\]]+\s+([^\]]+)\]', r'\1', text)
    # Remove bare URLs
    text = re.sub(r'https?://[^\s\]]+', '', text)
    # Remove template markup {{...}}
    text = re.sub(r'\{\{(?:Border|Scroll|Collapse|Tabber|SITENAME)[^}]*\}\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\{\{[^}]{0,100}\}\}', '', text)
    # Remove bold/italic markup
    text = re.sub(r"'{2,3}", '', text)
    # Remove section headers == ==
    text = re.sub(r'={2,}\s*([^=]+?)\s*={2,}', r'\n\n\1\n', text)
    # Remove ref tags
    text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.DOTALL)
    text = re.sub(r'<ref[^>]*/>', '', text)
    # Remove other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove category links
    text = re.sub(r'\[\[Category:[^\]]*\]\]', '', text)
    # Clean up whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'  +', ' ', text)
    return text.strip()

def extract_sections(wikitext: str) -> dict:
    """Split wikitext into sections by == headers."""
    sections = {}
    # Split on == Header ==
    parts = re.split(r'(?:^|\n)==\s*([^=]+?)\s*==(?:\n|$)', wikitext)
    # parts[0] = intro, then alternating: header, content, header, content...
    intro = parts[0].strip()
    if intro:
        sections['_intro'] = intro
    for i in range(1, len(parts)-1, 2):
        header = parts[i].strip()
        content = parts[i+1].strip() if i+1 < len(parts) else ''
        sections[header] = content
    return sections

def parse_types(wikitext: str) -> list:
    """Parse Type 1/Type 2/etc entries."""
    types = []
    # Pattern: '''Type N: Name:''' Description
    # or '''N: Name:''' Description
    pattern = r"'{3}(?:Type\s*)?(\d+):\s*([^:']+):?'{3}\s*(.*?)(?='{3}(?:Type\s*)?\d+:|$)"
    matches = re.findall(pattern, wikitext, re.DOTALL)
    for num, name, desc in matches:
        desc_clean = clean_wikitext(desc)
        # Extract examples if present
        examples = []
        ex_match = re.search(r"'''Examples?:'''\s*(.*?)(?:\n\n|\Z)", desc, re.DOTALL)
        if ex_match:
            examples = [e.strip() for e in re.split(r',(?!\s*\w+\s*\])', ex_match.group(1)) if e.strip()]
        
        types.append({
            'type': int(num),
            'name': name.strip(),
            'description': desc_clean[:2000],
            'examples': examples[:10]
        })
    return types

def parse_page(filepath: str) -> dict:
    """Parse a single page JSON file into structured knowledge."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    title = data['title']
    wikitext = data['wikitext']
    sections = extract_sections(wikitext)
    
    # Get summary (from Summary section or intro)
    summary_raw = sections.get('Summary', sections.get('_intro', ''))
    summary = clean_wikitext(summary_raw)
    
    # Get types
    types = parse_types(wikitext)
    
    # Get possible uses
    uses_raw = sections.get('Possible Uses', sections.get('Applications', ''))
    uses = []
    if uses_raw:
        # Extract bullet points
        for line in uses_raw.split('\n'):
            line = line.strip()
            if line.startswith('*'):
                clean = clean_wikitext(line.lstrip('*')).strip()
                if clean and len(clean) > 2:
                    uses.append(clean)
    
    # Get notes
    notes_raw = sections.get('Notes', sections.get('Limitations', ''))
    notes = clean_wikitext(notes_raw) if notes_raw else ''
    
    # Get tiering info if present (for stat pages)
    tiers = []
    for key, val in sections.items():
        if 'tier' in key.lower() or 'level' in key.lower():
            clean_val = clean_wikitext(val)
            if clean_val:
                tiers.append({'name': key, 'description': clean_val[:500]})
    
    # Build result
    result = {
        'title': title,
        'category': 'powers',  # will be overridden for stats
        'summary': summary[:3000],
        'types': types,
        'uses': uses[:30],
        'notes': notes[:2000],
        'tiers': tiers,
        'sections': list(sections.keys()),
        'raw_chars': len(wikitext),
    }
    
    return result

def parse_stat_page(filepath: str) -> dict:
    """Parse a stat page (Attack Potency, Speed, etc) - these have tier breakdowns."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    title = data['title']
    wikitext = data['wikitext']
    sections = extract_sections(wikitext)
    
    # Get summary
    summary_raw = sections.get('Summary', sections.get('_intro', ''))
    summary = clean_wikitext(summary_raw)
    
    # Extract tier definitions
    tier_defs = []
    # Pattern: ====Tier==== or ===Tier=== followed by description
    tier_pattern = r'={3,}\s*([^=]+?)\s*={3,}\s*\n(.*?)(?=\n={3,}|\Z)'
    for match in re.finditer(tier_pattern, wikitext, re.DOTALL):
        tier_name = match.group(1).strip()
        tier_desc = clean_wikitext(match.group(2))
        if tier_desc and len(tier_desc) > 10:
            tier_defs.append({
                'tier': tier_name,
                'description': tier_desc[:1000]
            })
    
    return {
        'title': title,
        'category': 'stats',
        'summary': summary[:3000],
        'tier_definitions': tier_defs,
        'sections': list(sections.keys()),
        'raw_chars': len(wikitext),
    }

def parse_all():
    """Parse all downloaded pages."""
    knowledge = {
        'powers': [],
        'stats': [],
        'glossary': [],
    }
    
    # Parse powers pages
    powers_dir = os.path.join(BASE_DIR, 'powers')
    if os.path.exists(powers_dir):
        for fname in sorted(os.listdir(powers_dir)):
            if fname.endswith('.json'):
                filepath = os.path.join(powers_dir, fname)
                try:
                    result = parse_page(filepath)
                    result['category'] = 'powers'
                    knowledge['powers'].append(result)
                except Exception as e:
                    print(f"  ERROR parsing {fname}: {e}")
    
    # Parse stat pages
    stats_dir = os.path.join(BASE_DIR, 'stats')
    if os.path.exists(stats_dir):
        for fname in sorted(os.listdir(stats_dir)):
            if fname.endswith('.json'):
                filepath = os.path.join(stats_dir, fname)
                try:
                    result = parse_stat_page(filepath)
                    knowledge['stats'].append(result)
                except Exception as e:
                    print(f"  ERROR parsing {fname}: {e}")
    
    # Parse glossary pages
    glossary_dir = os.path.join(BASE_DIR, 'glossary')
    if os.path.exists(glossary_dir):
        for fname in sorted(os.listdir(glossary_dir)):
            if fname.endswith('.json'):
                filepath = os.path.join(glossary_dir, fname)
                try:
                    result = parse_page(filepath)
                    result['category'] = 'glossary'
                    knowledge['glossary'].append(result)
                except Exception as e:
                    print(f"  ERROR parsing {fname}: {e}")
    
    return knowledge

if __name__ == '__main__':
    print("Parsing all VS Battles Wiki pages...")
    knowledge = parse_all()
    
    # Save structured knowledge
    out_path = os.path.join(BASE_DIR, 'knowledge_parsed.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(knowledge, f, ensure_ascii=False, indent=2)
    
    # Stats
    total = sum(len(v) for v in knowledge.values())
    print(f"\nParsed {total} pages:")
    for cat, pages in knowledge.items():
        print(f"  {cat}: {len(pages)} pages")
    
    # Show sample
    if knowledge['powers']:
        sample = knowledge['powers'][0]
        print(f"\nSample: {sample['title']}")
        print(f"  Summary: {sample['summary'][:200]}...")
        print(f"  Types: {len(sample['types'])}")
        print(f"  Uses: {len(sample['uses'])}")
    
    print(f"\nSaved to: {out_path}")
