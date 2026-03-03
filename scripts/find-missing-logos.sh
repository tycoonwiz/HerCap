#!/bin/bash

# Find companies missing logos

LOGOS_DIR="/Users/joshdaghir/Documents/Hercap/hercap/public/logos"

echo "📊 Checking for companies without matching logos..."
echo ""

missing_count=0
missing_companies=()

while IFS= read -r company; do
  # Skip empty lines
  [ -z "$company" ] && continue

  # Try various filename formats
  found=false

  # With underscores
  base=$(echo "$company" | sed 's/ /_/g')
  for ext in .png .webp .avif .svg .jpg .jpeg; do
    if [ -f "$LOGOS_DIR/${base}${ext}" ]; then
      found=true
      break
    fi
    # Try lowercase
    base_lower=$(echo "$base" | tr '[:upper:]' '[:lower:]')
    if [ -f "$LOGOS_DIR/${base_lower}${ext}" ]; then
      found=true
      break
    fi
  done

  # Without spaces (no underscores)
  if [ "$found" = false ]; then
    base=$(echo "$company" | sed 's/ //g')
    for ext in .png .webp .avif .svg .jpg .jpeg; do
      if [ -f "$LOGOS_DIR/${base}${ext}" ]; then
        found=true
        break
      fi
      # Try lowercase
      base_lower=$(echo "$base" | tr '[:upper:]' '[:lower:]')
      if [ -f "$LOGOS_DIR/${base_lower}${ext}" ]; then
        found=true
        break
      fi
    done
  fi

  if [ "$found" = false ]; then
    echo "  ❌ $company"
    ((missing_count++))
    missing_companies+=("$company")
  fi
done < /tmp/companies.txt

echo ""
echo "Summary:"
echo "--------"
echo "Total companies: $(wc -l < /tmp/companies.txt | tr -d ' ')"
echo "Companies with logos: $(($(wc -l < /tmp/companies.txt | tr -d ' ') - missing_count))"
echo "Companies missing logos: $missing_count"
echo ""

if [ $missing_count -gt 0 ]; then
  echo "Missing logo files needed:"
  for company in "${missing_companies[@]}"; do
    base=$(echo "$company" | sed 's/ /_/g')
    echo "  - ${base}.png"
  done
fi
