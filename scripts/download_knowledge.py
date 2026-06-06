#!/usr/bin/env python3
"""Bulk download VS Battles Wiki pages for knowledge base."""
import json
import os
import sys
import time
import urllib.request
import urllib.parse

API_URL = "https://vsbattles.fandom.com/api.php"
BASE_DIR = "/root/sabung_detbetel/data/knowledge"

def fetch_page(title: str) -> dict | None:
    """Fetch a single page's wikitext via MediaWiki API."""
    params = urllib.parse.urlencode({
        'action': 'parse',
        'page': title,
        'prop': 'wikitext|sections',
        'format': 'json'
    })
    url = f"{API_URL}?{params}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'DeathBattleBot/1.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            if 'error' in data:
                return None
            return {
                'title': data['parse']['title'],
                'wikitext': data['parse']['wikitext']['*'],
                'sections': [s['line'] for s in data['parse'].get('sections', [])]
            }
    except Exception as e:
        print(f"  ERROR fetching {title}: {e}")
        return None

def save_page(page_data: dict, category: str):
    """Save page data as JSON."""
    out_dir = os.path.join(BASE_DIR, category)
    os.makedirs(out_dir, exist_ok=True)
    
    title = page_data['title']
    # Clean filename
    filename = title.replace(' ', '_').replace('/', '_').replace(':', '_') + '.json'
    filepath = os.path.join(out_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(page_data, f, ensure_ascii=False, indent=2)
    
    return filepath

def download_batch(pages: list[str], category: str, delay: float = 0.3):
    """Download a batch of pages with rate limiting."""
    results = {}
    for i, title in enumerate(pages):
        print(f"  [{i+1}/{len(pages)}] {title}", end=" ")
        data = fetch_page(title)
        if data:
            path = save_page(data, category)
            results[title] = {
                'file': os.path.basename(path),
                'chars': len(data['wikitext']),
                'sections': len(data['sections'])
            }
            print(f"✓ ({len(data['wikitext'])} chars, {len(data['sections'])} sections)")
        else:
            print("✗ FAILED")
        time.sleep(delay)
    return results

def main():
    # Load download list
    with open(os.path.join(BASE_DIR, 'download_list.json')) as f:
        lists = json.load(f)
    
    all_results = {}
    
    # 1. Stats pages
    print(f"\n=== Downloading {len(lists['stats'])} Stat Pages ===")
    results = download_batch(lists['stats'], 'stats')
    all_results.update(results)
    
    # 2. Glossary pages
    print(f"\n=== Downloading {len(lists['glossary'])} Glossary Pages ===")
    results = download_batch(lists['glossary'], 'glossary')
    all_results.update(results)
    
    # 3. Powers & Abilities pages (the big one)
    print(f"\n=== Downloading {len(lists['powers'])} Powers & Abilities Pages ===")
    results = download_batch(lists['powers'], 'powers', delay=0.2)
    all_results.update(results)
    
    # Save master index
    index_path = os.path.join(BASE_DIR, 'knowledge_index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== DONE ===")
    print(f"Total pages downloaded: {len(all_results)}")
    print(f"Index saved to: {index_path}")

if __name__ == '__main__':
    main()
