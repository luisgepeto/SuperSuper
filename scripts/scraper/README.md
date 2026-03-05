# Supermarket Product Scraper

Scripts to scrape product names and category hierarchies from supermarket websites.
This data is used to train an SVC (Support Vector Classifier) for improved product categorization in SuperSuper.

## Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browser (required for Wegmans)
playwright install chromium
```

## Scrapers

### Wegmans (`wegmans_scraper.py`)

Scrapes product names and category hierarchies from wegmans.com using Playwright browser automation.

**Features:**
- Automatic store selection (Pittsford, NY - includes alcohol catalog)
- Infinite scroll handling (loads all products per category, 30 at a time)
- Streaming batch writes (flushes every 30 products to avoid data loss)
- Resume support for interrupted scrapes
- Configurable limits for testing

**Usage:**

```bash
# Test run: scrape 2 categories with 5 products each
python wegmans_scraper.py --limit 2 --products-per-category 5

# Scrape a specific category
python wegmans_scraper.py --category-url "https://www.wegmans.com/shop/categories/4459767" --products-per-category 10

# Full scrape (all categories, all products)
python wegmans_scraper.py

# Resume a scrape that was interrupted
python wegmans_scraper.py --resume
```

**Options:**
- `--limit N` - Limit number of categories to scrape
- `--products-per-category N` - Limit products per category page
- `--category-url URL` - Scrape a single specific category URL
- `--resume` - Resume from where a previous run left off (uses progress files in data/)

**Output:** `data/wegmans_YYYYMMDD.jsonl`

## Output Format

Each line is a JSON object (JSON Lines format):

```json
{
  "source": "wegmans",
  "product_name": "Wegmans Italian Classics Parmigiano Reggiano Cheese",
  "category_hierarchy": ["Departments", "Cheese", "Hard Cheeses"],
  "hierarchy_depth": 3,
  "source_url": "https://www.wegmans.com/shop/categories/4459767",
  "scraped_at": "2026-03-04T01:56:06.706718+00:00"
}
```

See `data/sample_output.jsonl` for more examples.

## Data Directory

- `data/*.jsonl` files are tracked in git (scraped training data for the SVC)
- `data/sample_output.jsonl` is committed as a schema reference
- Progress/tracking files (`*_progress.json`, `*_categories.json`) are gitignored - they are only used during active scrape runs
