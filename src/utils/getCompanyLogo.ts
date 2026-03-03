import { logoMap } from './logoMap';

/**
 * Converts a company name to its corresponding logo filename.
 * Uses a pre-generated mapping to match company names to actual logo files.
 *
 * @param companyName - The company name from the Google Sheet
 * @returns The relative path to the logo image
 *
 * @example
 * getCompanyLogo("Animal Biome") // returns "/logos/AnimalBiome.png" (or "/HerCap/logos/AnimalBiome.png" on GitHub Pages)
 * getCompanyLogo("Coffee Cloud") // returns "/logos/coffeecloud.png" (or "/HerCap/logos/coffeecloud.png" on GitHub Pages)
 */
export function getCompanyLogo(companyName: string): string {
  if (!companyName) return '';

  // Normalize the company name for lookup (lowercase, trimmed)
  const normalizedName = companyName.trim().toLowerCase();

  // Look up the actual filename from the mapping
  let filename = logoMap[normalizedName];

  // If not found, try removing all spaces (for names like "Woof Together" -> "wooftogether")
  if (!filename) {
    const noSpacesName = normalizedName.replace(/\s+/g, '');
    filename = logoMap[noSpacesName];
  }

  if (filename) {
    return `${import.meta.env.BASE_URL}logos/${filename}`;
  }

  // Fallback: return empty string (will trigger error handler)
  return '';
}

/**
 * Gets the company logo with fallback options.
 * Returns the logo path if available, otherwise returns a placeholder or initials.
 *
 * @param companyName - The company name from the Google Sheet
 * @returns An object with logo info
 */
export function getCompanyLogoWithFallback(companyName: string): {
  type: 'logo' | 'initials';
  value: string;
} {
  const logoPath = getCompanyLogo(companyName);

  if (logoPath) {
    return {
      type: 'logo',
      value: logoPath,
    };
  }

  return {
    type: 'initials',
    value: companyName.substring(0, 2).toUpperCase(),
  };
}
