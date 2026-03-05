"""
Wegmans Product Scraper

Scrapes product names and category hierarchies from wegmans.com.
Uses Playwright for browser automation since Wegmans is a client-rendered SPA.

Features:
  - Infinite scroll handling (loads all products, not just first 30)
  - Store location selection (Pittsford, NY for broadest catalog including alcohol)
  - Resume support: saves a categories index and tracks progress so you can restart
  - Streaming writes: flushes products to disk every 30 items while scrolling

Usage:
    python wegmans_scraper.py                    # Scrape all departments
    python wegmans_scraper.py --resume           # Resume from where we left off
    python wegmans_scraper.py --limit 2          # Scrape only 2 leaf categories (for testing)
    python wegmans_scraper.py --products-per-category 5  # Limit products per category

Output: data/wegmans_YYYYMMDD.jsonl
"""

import json
import time
import sys
import os
import re
import argparse
from datetime import datetime, timezone

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('Error: playwright is not installed. Run: pip install playwright && playwright install chromium')
    sys.exit(1)

SOURCE = 'wegmans'
BASE_URL = 'https://www.wegmans.com'
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
REQUEST_DELAY = 2  # seconds between page navigations
SCROLL_WAIT = 3  # seconds to wait after each scroll for new products to load
MAX_SCROLLS = 50  # safety cap to prevent infinite scroll loops
FLUSH_BATCH_SIZE = 30  # write to disk every N products during scrolling
# Pittsford, NY - a large Wegmans that carries alcohol (Wine, Beer & Spirits)
STORE_ID = '25'
STORE_NAME = 'Pittsford'
STORE_PAGE = 'pittsford-ny'

# Progress tracking files
CATEGORIES_INDEX_FILE = os.path.join(OUTPUT_DIR, f'{SOURCE}_categories.json')
PROGRESS_FILE = os.path.join(OUTPUT_DIR, f'{SOURCE}_progress.json')


def get_output_path():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    date_str = datetime.now().strftime('%Y%m%d')
    return os.path.join(OUTPUT_DIR, f'{SOURCE}_{date_str}.jsonl')


def save_progress(category_index, total_categories):
    """Save current scraping progress to a JSON file."""
    progress = {
        'last_completed_index': category_index,
        'total_categories': total_categories,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, indent=2)


def load_progress():
    """Load previous scraping progress. Returns the index to resume from."""
    if not os.path.exists(PROGRESS_FILE):
        return 0
    try:
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            progress = json.load(f)
        resume_from = progress.get('last_completed_index', -1) + 1
        print(f'  Found progress file: last completed index {progress["last_completed_index"]}, resuming from {resume_from}')
        return resume_from
    except Exception as e:
        print(f'  Warning: Could not load progress file: {e}')
        return 0


def save_categories_index(categories):
    """Save discovered categories to a JSON file for resume support."""
    with open(CATEGORIES_INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(categories, f, indent=2)
    print(f'  Saved categories index to {CATEGORIES_INDEX_FILE}')


def load_categories_index():
    """Load previously discovered categories."""
    if not os.path.exists(CATEGORIES_INDEX_FILE):
        return None
    try:
        with open(CATEGORIES_INDEX_FILE, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        print(f'  Loaded {len(categories)} categories from index file')
        return categories
    except Exception as e:
        print(f'  Warning: Could not load categories index: {e}')
        return None


def flush_products(f, products, hierarchy, url):
    """Write a batch of products to the output file and flush to disk."""
    for name in products:
        record = {
            'source': SOURCE,
            'product_name': name,
            'category_hierarchy': hierarchy,
            'hierarchy_depth': len(hierarchy),
            'source_url': url,
            'scraped_at': datetime.now(timezone.utc).isoformat(),
        }
        f.write(json.dumps(record) + '\n')
    f.flush()
    return len(products)


def extract_breadcrumb(page):
    """Extract category hierarchy from the breadcrumb navigation."""
    breadcrumb_parts = []
    try:
        crumbs = page.locator('nav[aria-label="Breadcrumb"] a, nav[aria-label="Breadcrumb"] span')
        count = crumbs.count()
        if count == 0:
            crumbs = page.locator('[class*="breadcrumb"] a, [class*="breadcrumb"] span, [class*="Breadcrumb"] a, [class*="Breadcrumb"] span')
            count = crumbs.count()

        for i in range(count):
            text = crumbs.nth(i).inner_text().strip()
            if text and text != '/' and text != '>':
                breadcrumb_parts.append(text)
    except Exception as e:
        print(f'  Warning: Could not extract breadcrumb: {e}')

    return breadcrumb_parts


def get_expected_product_count(page):
    """Parse the '{N} Results' count from the page."""
    try:
        text = page.locator('text=/\\d+\\s*Results/').first.inner_text()
        match = re.search(r'(\d+)', text)
        if match:
            return int(match.group(1))
    except Exception:
        pass
    return None


def scrape_category_streaming(page, category_url, f, products_limit=None):
    """
    Navigate to a category page and stream products to the output file in batches.
    Returns the total number of products written.
    """
    written = 0
    try:
        page.goto(category_url, wait_until='domcontentloaded', timeout=30000)
        time.sleep(5)

        # Extract breadcrumb hierarchy
        hierarchy = extract_breadcrumb(page)
        if not hierarchy:
            heading = page.locator('h1, h2').first
            if heading.count() > 0:
                heading_text = heading.inner_text().strip()
                if heading_text:
                    hierarchy = [heading_text]

        print(f'  Hierarchy: {" > ".join(hierarchy) if hierarchy else "(unknown)"}')

        # Check if this is a leaf category with products
        try:
            page.wait_for_selector('.component--product-tile', timeout=15000)
        except Exception:
            print(f'  Found 0 products (parent category, skipping)')
            return 0

        expected = get_expected_product_count(page)
        if expected:
            print(f'  Total expected: {expected} products')

        # Scroll and extract in batches
        extracted_names = set()
        prev_tile_count = 0

        for scroll in range(MAX_SCROLLS):
            current_tile_count = page.locator('.component--product-tile').count()

            # Extract new product names from tiles we haven't read yet
            elements = page.locator('.component--product-tile h3.global--card-title')
            batch = []
            for i in range(elements.count()):
                name = elements.nth(i).inner_text().strip()
                if name and name not in extracted_names:
                    extracted_names.add(name)
                    batch.append(name)

                    if products_limit and len(extracted_names) >= products_limit:
                        break

            # Flush batch to disk
            if batch:
                count = flush_products(f, batch, hierarchy, category_url)
                written += count
                print(f'  ... {written} products written to disk')

            # Check if we're done
            if products_limit and len(extracted_names) >= products_limit:
                break
            if expected and current_tile_count >= expected:
                break
            if current_tile_count == prev_tile_count and scroll > 0:
                break

            prev_tile_count = current_tile_count
            page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            time.sleep(SCROLL_WAIT)

        print(f'  Found {written} products')

    except Exception as e:
        print(f'  Error scraping {category_url}: {e}')

    return written


def select_store(page):
    """
    Select the Pittsford, NY Wegmans store to ensure the broadest catalog,
    including Wine, Beer & Spirits.
    """
    print(f'Selecting store: {STORE_NAME}, NY (store #{STORE_ID})...')
    page.goto(f'{BASE_URL}/stores/{STORE_PAGE}', wait_until='domcontentloaded', timeout=30000)
    time.sleep(3)

    shop_btn = page.locator('button:has-text("SHOP THIS STORE")')
    if shop_btn.count() > 0:
        shop_btn.first.click()
        time.sleep(5)

        context = page.evaluate('() => localStorage.getItem("shopping-context-storage")')
        if context:
            data = json.loads(context)
            state = data.get('state', {})
            store_name = state.get('storeDetails', {}).get('storeName', 'unknown')
            sells_alcohol = state.get('sellsAlcohol', False)
            alcohol_types = state.get('alcoholTypesForSale', [])
            print(f'  Store set: {store_name} (sellsAlcohol={sells_alcohol}, types={alcohol_types})')
            return True

    print('  Warning: Could not select store via UI button')
    return False


def discover_categories(page, limit=None):
    """
    Discover category URLs by navigating the Wegmans department page.
    Returns a list of dicts with 'url' and 'name' keys.
    """
    categories = []
    print('Discovering categories from Wegmans...')

    page.goto(f'{BASE_URL}/shop', wait_until='domcontentloaded', timeout=30000)
    time.sleep(REQUEST_DELAY)

    links = page.locator('a[href*="/shop/categories/"]')
    count = links.count()
    print(f'  Found {count} category links on shop page')

    seen_urls = set()
    for i in range(count):
        try:
            href = links.nth(i).get_attribute('href')
            text = links.nth(i).inner_text().strip()
            if href and text:
                full_url = href if href.startswith('http') else f'{BASE_URL}{href}'
                if full_url not in seen_urls:
                    seen_urls.add(full_url)
                    categories.append({
                        'url': full_url,
                        'name': text,
                    })
        except Exception:
            continue

    print(f'  Discovered {len(categories)} unique categories')

    if limit and len(categories) > limit:
        categories = categories[:limit]
        print(f'  Limited to {limit} categories for testing')

    return categories


def main():
    parser = argparse.ArgumentParser(description='Scrape product data from Wegmans')
    parser.add_argument('--limit', type=int, default=None,
                        help='Limit number of categories to scrape (for testing)')
    parser.add_argument('--products-per-category', type=int, default=None,
                        help='Limit number of products per category')
    parser.add_argument('--category-url', type=str, default=None,
                        help='Scrape a specific category URL instead of discovering')
    parser.add_argument('--resume', action='store_true',
                        help='Resume from where the last run left off')
    args = parser.parse_args()

    output_path = get_output_path()
    total_products = 0

    print(f'Wegmans Scraper')
    print(f'Output: {output_path}')
    print(f'Category limit: {args.limit or "none"}')
    print(f'Products per category limit: {args.products_per_category or "none"}')
    print(f'Resume mode: {args.resume}')
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 800},
        )
        page = context.new_page()

        try:
            select_store(page)

            if args.category_url:
                categories = [{'url': args.category_url, 'name': 'direct'}]
                start_index = 0
            else:
                # Try to reuse saved categories index on resume
                if args.resume:
                    categories = load_categories_index()
                    if categories:
                        start_index = load_progress()
                    else:
                        categories = discover_categories(page, limit=args.limit)
                        save_categories_index(categories)
                        start_index = 0
                else:
                    categories = discover_categories(page, limit=args.limit)
                    save_categories_index(categories)
                    start_index = 0

            if not categories:
                print('No categories found. Exiting.')
                return

            # Open in append mode for resume, write mode for fresh start
            file_mode = 'a' if args.resume and start_index > 0 else 'w'
            print(f'\nScraping categories {start_index + 1} to {len(categories)} ({len(categories) - start_index} remaining)')

            with open(output_path, file_mode, encoding='utf-8') as f:
                for i in range(start_index, len(categories)):
                    cat = categories[i]
                    print(f'\n[{i + 1}/{len(categories)}] Scraping: {cat["name"]} ({cat["url"]})')

                    count = scrape_category_streaming(
                        page, cat['url'], f, args.products_per_category
                    )
                    total_products += count

                    # Save progress after each category
                    save_progress(i, len(categories))

                    if i < len(categories) - 1:
                        time.sleep(REQUEST_DELAY)

        finally:
            browser.close()

    print(f'\nDone. Scraped {total_products} products from {len(categories) - start_index} categories.')
    print(f'Output: {output_path}')

    # Clean up progress files on successful completion
    for pf in [PROGRESS_FILE, CATEGORIES_INDEX_FILE]:
        if os.path.exists(pf):
            os.remove(pf)
    print('Cleaned up progress files.')


if __name__ == '__main__':
    main()
