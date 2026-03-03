#!/usr/bin/env node

/**
 * Check which companies are missing logo files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyB7y_qbODe8bJVQSqDjFxB-SLvQJqCcKXO6rYTMPCvMxIVvWP_xQvR9bLH9vJJVbOo8dLYlxOZNBj/pub?output=csv';
const LOGOS_DIR = path.join(__dirname, '..', 'logos');
const LOGO_EXTENSIONS = ['.png', '.webp', '.avif', '.svg', '.jpg', '.jpeg'];

async function fetchCompanies() {
  const response = await fetch(SHEET_URL);
  const csvText = await response.text();
  const lines = csvText.split('\n').slice(1); // Skip header

  const companies = lines
    .filter(line => line.trim())
    .map(line => {
      const match = line.match(/^"?([^",]+)"?/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);

  return companies;
}

async function getLogoFiles() {
  const files = await fs.readdir(LOGOS_DIR);
  return new Set(files.map(f => f.toLowerCase()));
}

function getLogoVariations(companyName) {
  const variations = [
    companyName.replace(/\s+/g, '_'),
    companyName.replace(/\s+/g, '_').toLowerCase(),
    companyName.replace(/\s+/g, ''),
    companyName.replace(/\s+/g, '').toLowerCase(),
  ];

  const allVariations = [];
  for (const variation of variations) {
    for (const ext of LOGO_EXTENSIONS) {
      allVariations.push((variation + ext).toLowerCase());
    }
  }

  return allVariations;
}

async function main() {
  console.log('📊 Checking for missing logos...\n');

  const companies = await fetchCompanies();
  const logoFiles = await getLogoFiles();

  const missingLogos = [];

  for (const company of companies) {
    const variations = getLogoVariations(company);
    const hasLogo = variations.some(v => logoFiles.has(v));

    if (!hasLogo) {
      missingLogos.push(company);
    }
  }

  if (missingLogos.length === 0) {
    console.log('✅ All companies have logos!\n');
  } else {
    console.log(`❌ Missing logos for ${missingLogos.length} companies:\n`);
    missingLogos.forEach(company => {
      console.log(`  - ${company}`);
    });
    console.log();
  }

  console.log(`Total companies: ${companies.length}`);
  console.log(`Companies with logos: ${companies.length - missingLogos.length}`);
  console.log(`Companies missing logos: ${missingLogos.length}\n`);
}

main().catch(console.error);
