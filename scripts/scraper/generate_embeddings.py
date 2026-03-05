"""
Generate embeddings for scraped product data and app subcategories.

Uses sentence-transformers with all-MiniLM-L6-v2 (same model as the browser app)
to generate 384-dimensional embeddings. Caches results as .npy files.

Usage:
    python generate_embeddings.py
    python generate_embeddings.py --input data/wegmans_20260304.jsonl
"""

import argparse
import json
import os
import time

import numpy as np
from sentence_transformers import SentenceTransformer

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')
EMBEDDINGS_DIR = os.path.join(DATA_DIR, 'embeddings')
MODEL_NAME = 'all-MiniLM-L6-v2'
BATCH_SIZE = 256

# App's subcategory definitions (from src/services/categoryClassification.js)
APP_CATEGORY_DEFINITIONS = {
    'Fruits & vegetables': ['fruit', 'vegetables'],
    'Meat & seafood': ['meat', 'seafood', 'tofu', 'meat alternatives'],
    'Bakery & bread': ['bread', 'breading & crumbs', 'cookies', 'dessert', 'pastries', 'tortillas', 'cakes'],
    'Dairy & eggs': [
        'biscuit dough', 'cookie dough', 'butter', 'margarine', 'cheese', 'cottage cheese',
        'cream', 'eggs', 'egg substitute', 'milk', 'pudding', 'gelatine', 'sour cream', 'yogurt'
    ],
    'Deli & prepared food': ['dip', 'deli cheese', 'deli meat', 'ready meals', 'ready snacks'],
    'Pantry': [
        'baking ingredients', 'broth', 'bouillon', 'canned food', 'dried food', 'cereal', 'breakfast',
        'condiments', 'dressing', 'oil', 'vinegar', 'jelly', 'jam', 'pantry meals', 'pasta', 'rice',
        'peanut butter', 'salsa', 'sauces', 'marinades', 'snacks', 'candy', 'soups', 'chili',
        'spices', 'seasonings', 'sugar', 'sweeteners'
    ],
    'Frozen food': [
        'frozen bread', 'frozen baked goods', 'frozen fruit', 'ice cream', 'frozen treats',
        'frozen juice', 'frozen smoothies', 'frozen meals', 'frozen sides', 'frozen meat',
        'frozen meat alternatives', 'frozen seafood', 'frozen vegetables'
    ],
    'Beverages': [
        'beer', 'wine', 'cocoa', 'coconut water', 'coffee', 'coffee creamer', 'coffee filters',
        'ice', 'juice', 'beverage mixes', 'beverage flavor enhancers', 'shakes', 'smoothies',
        'soda', 'sports drinks', 'energy drinks', 'tea', 'water'
    ],
    'Everyday essentials': [
        'air fresheners', 'candles', 'batteries', 'cleaners', 'cleaning tools',
        'disposable kitchenware', 'facial tissue', 'food storage', 'food wraps',
        'laundry', 'paper towels', 'toilet paper', 'trash bags'
    ],
    'Health & beauty': [
        'bath & skin care', 'hair care', 'makeup', 'nails', 'cotton balls', 'cotton swabs',
        'diet & fitness', 'eye care', 'ear care', 'feminine care', 'foot care',
        'home health care', 'incontinence', 'medicines', 'treatments', 'oral hygiene',
        'sexual wellness', 'vitamins', 'supplements'
    ],
    'Home & outdoor': [
        'bedding', 'clothes', 'shoes', 'seasonal decor', 'electronics', 'home improvement',
        'kitchen & dining', 'patio & outdoor', 'pest control', 'school supplies',
        'office supplies', 'storage', 'organization', 'flowers', 'gift baskets'
    ],
    'Baby & kids': [
        'baby food', 'baby formula', 'diapers', 'potty', 'baby health', 'baby skin care',
        'toys', 'baby feeding', 'baby bath tubs & accessories', 'nursery & kids room',
        'baby clothing', 'kids clothing', 'baby travel equipment'
    ],
    'Pets': ['dogs', 'cats', 'birds', 'fish', 'small animals', 'reptiles']
};


def find_latest_jsonl():
    """Find the most recent scraped data file."""
    jsonl_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.jsonl') and f != 'sample_output.jsonl']
    if not jsonl_files:
        raise FileNotFoundError('No scraped data files found in data/ directory')
    jsonl_files.sort(reverse=True)
    return os.path.join(DATA_DIR, jsonl_files[0])


def load_products(input_file):
    """Load products from JSONL file."""
    products = []
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                products.append(json.loads(line))
    return products


def generate_product_embeddings(model, products):
    """Generate embeddings for all product names."""
    product_names = [p['product_name'] for p in products]
    print(f'  Generating embeddings for {len(product_names)} products (batch size {BATCH_SIZE})...')

    start = time.time()
    embeddings = model.encode(product_names, batch_size=BATCH_SIZE, show_progress_bar=True, normalize_embeddings=True)
    elapsed = time.time() - start
    print(f'  Done in {elapsed:.1f}s ({len(product_names) / elapsed:.0f} products/sec)')

    return np.array(embeddings, dtype=np.float32)


def generate_subcategory_embeddings(model):
    """Generate embeddings for the app's subcategory names."""
    subcategories = []
    subcategory_meta = []

    for category, subs in APP_CATEGORY_DEFINITIONS.items():
        for sub in subs:
            subcategories.append(sub)
            subcategory_meta.append({'category': category, 'subcategory': sub})

    print(f'  Generating embeddings for {len(subcategories)} app subcategories...')
    embeddings = model.encode(subcategories, normalize_embeddings=True)

    return np.array(embeddings, dtype=np.float32), subcategory_meta


def extract_labels(products):
    """Extract category labels from products for SVC training."""
    labels = []
    for p in products:
        hierarchy = p['category_hierarchy']
        leaf = hierarchy[-1] if hierarchy else 'Unknown'
        labels.append(leaf)
    return labels


def main():
    parser = argparse.ArgumentParser(description='Generate embeddings for scraped product data')
    parser.add_argument('--input', help='Input JSONL file (default: latest in data/)')
    args = parser.parse_args()

    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)

    input_file = args.input or find_latest_jsonl()
    print(f'Input file: {input_file}')

    products = load_products(input_file)
    print(f'Loaded {len(products)} products')

    print(f'\nLoading model: {MODEL_NAME}')
    model = SentenceTransformer(MODEL_NAME)
    print(f'  Model loaded (embedding dimension: {model.get_sentence_embedding_dimension()})')

    # Generate product embeddings
    print('\n[1/3] Product embeddings')
    product_embeddings = generate_product_embeddings(model, products)
    embeddings_path = os.path.join(EMBEDDINGS_DIR, 'product_embeddings.npy')
    np.save(embeddings_path, product_embeddings)
    print(f'  Saved: {embeddings_path} (shape: {product_embeddings.shape})')

    # Save product labels (for SVC training)
    print('\n[2/3] Product labels')
    labels = extract_labels(products)
    unique_labels = sorted(set(labels))
    labels_path = os.path.join(EMBEDDINGS_DIR, 'product_labels.json')
    with open(labels_path, 'w', encoding='utf-8') as f:
        json.dump({
            'labels': labels,
            'unique_labels': unique_labels,
            'label_counts': {l: labels.count(l) for l in unique_labels},
            'total_products': len(labels),
            'total_unique_labels': len(unique_labels)
        }, f, indent=2)
    print(f'  Saved: {labels_path}')
    print(f'  {len(unique_labels)} unique categories, {len(labels)} total labels')

    # Generate subcategory embeddings
    print('\n[3/3] App subcategory embeddings')
    sub_embeddings, sub_meta = generate_subcategory_embeddings(model)
    sub_embeddings_path = os.path.join(EMBEDDINGS_DIR, 'subcategory_embeddings.npy')
    sub_meta_path = os.path.join(EMBEDDINGS_DIR, 'subcategory_meta.json')
    np.save(sub_embeddings_path, sub_embeddings)
    with open(sub_meta_path, 'w', encoding='utf-8') as f:
        json.dump(sub_meta, f, indent=2)
    print(f'  Saved: {sub_embeddings_path} (shape: {sub_embeddings.shape})')
    print(f'  Saved: {sub_meta_path} ({len(sub_meta)} subcategories)')

    print('\nDone. All embeddings cached in data/embeddings/')


if __name__ == '__main__':
    main()
