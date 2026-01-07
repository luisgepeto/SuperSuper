#!/bin/bash

# This script adjusts asset paths in the built files for GitHub Pages deployment
# It's designed to run only in the GitHub Actions workflow, not locally

BASE_PATH="$1"

if [ -z "$BASE_PATH" ]; then
  echo "Error: BASE_PATH argument is required"
  exit 1
fi

echo "Adjusting paths for GitHub Pages deployment with base path: $BASE_PATH"

# Function to adjust paths in an HTML file
adjust_html_paths() {
  local file="$1"
  if [ -f "$file" ]; then
    echo "Updating $file..."
    # Update all absolute paths to include the base path
    sed -i "s|href=\"/|href=\"${BASE_PATH}|g" "$file"
    sed -i "s|src=\"/|src=\"${BASE_PATH}|g" "$file"
  fi
}

# Adjust paths in index.html
adjust_html_paths "dist/index.html"

# Adjust paths in 404.html if it exists
adjust_html_paths "dist/404.html"

# Adjust paths in JavaScript files (for service worker registration)
echo "Updating JavaScript files..."
for jsfile in dist/assets/*.js; do
  if [ -f "$jsfile" ]; then
    # Update service worker registration path
    sed -i "s|register(\"/sw.js\")|register(\"${BASE_PATH}sw.js\")|g" "$jsfile"
    sed -i "s|register('/sw.js')|register('${BASE_PATH}sw.js')|g" "$jsfile"
  fi
done

# Update service worker file to handle the base path
if [ -f "dist/sw.js" ]; then
  echo "Updating dist/sw.js..."
  
  # Update the CACHE_URLS array - replace specific patterns only
  # Replace '/' in the CACHE_URLS array
  sed -i "/const CACHE_URLS = \[/,/\];/{
    s|  '/'|  '${BASE_PATH}'|g
    s|  '/src/|  '${BASE_PATH}src/|g
  }" dist/sw.js
  
  # Update the cache.match call in handleNavigationRequest function
  # This specifically targets the line: const cachedResponse = await cache.match('/');
  sed -i "s|cache\.match('/')|cache.match('${BASE_PATH}')|g" dist/sw.js
fi

echo "Path adjustments complete!"
