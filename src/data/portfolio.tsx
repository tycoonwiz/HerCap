import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";

export interface Company {
  id: number;
  name: string;
  description: string;
  stage: "Angel" | "Early" | "Growth";
  location: string;
  primary: string;
  secondary?: string;
  tertiary?: string;
  website: string;
}

// Google Sheets configuration
const SHEET_ID = "1Oz3B95FhB8ytGJvPKKk2T25ZRpl9GqUePBLDUwq2iRE";
const SHEET_NAME = "Herald_Capital_Portfolio";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// CSV column indices (0-based):
// 0: Company, 1: Description, 2: Fundraising_Stage, 3: Location,
// 4: Primary_Category, 5: Secondary_Category, 6: Tertiary_Category, 7: Website
const COL = {
  COMPANY: 0,
  DESCRIPTION: 1,
  FUNDRAISING_STAGE: 2,
  LOCATION: 3,
  PRIMARY_CATEGORY: 4,
  SECONDARY_CATEGORY: 5,
  TERTIARY_CATEGORY: 6,
  WEBSITE: 7,
} as const;

function parseRow(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCSV(csv: string): Company[] {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  const companies: Company[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const v = parseRow(line);
    const name = v[COL.COMPANY];
    const location = v[COL.LOCATION];
    const primary = v[COL.PRIMARY_CATEGORY];

    if (!name || !location || !primary) continue;

    companies.push({
      id: i,
      name,
      description: v[COL.DESCRIPTION] || "",
      stage: (v[COL.FUNDRAISING_STAGE] as Company["stage"]) || "Early",
      location,
      primary,
      secondary: v[COL.SECONDARY_CATEGORY] || undefined,
      tertiary: v[COL.TERTIARY_CATEGORY] || undefined,
      website: v[COL.WEBSITE] || "",
    });
  }

  return companies;
}

// Portfolio data context
interface PortfolioContextType {
  portfolioData: Company[];
  loading: boolean;
  error: string | null;
}

const PortfolioContext = createContext<PortfolioContextType>({
  portfolioData: [],
  loading: true,
  error: null,
});

export function PortfolioProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [portfolioData, setPortfolioData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(CSV_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch portfolio data");
        return response.text();
      })
      .then((csv) => {
        const companies = parseCSV(csv);
        // Filter out Blink and SpotOn companies
        const filteredCompanies = companies.filter(
          (c) => 
            c.name.toLowerCase() !== "blink" && 
            c.name.toLowerCase() !== "spoton" &&
            c.name.toLowerCase() !== "blink mobility"
        );
        setPortfolioData(filteredCompanies);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching portfolio data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <PortfolioContext.Provider value={{ portfolioData, loading, error }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}

export const navItems = [
  { label: "About", href: "#about" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Case Studies", href: "#case-studies" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export const cityCoords: Record<string, { lat: number; lng: number }> = {
  "New York, NY": { lat: 40.7128, lng: -74.006 },
  "Bellevue, WA": { lat: 47.6101, lng: -122.2015 },
  "San Francisco, CA": { lat: 37.7749, lng: -122.4194 },
  "Palo Alto, CA": { lat: 37.4419, lng: -122.143 },
  "Cincinnati, OH": { lat: 39.1031, lng: -84.512 },
  "Ann Arbor, MI": { lat: 42.2808, lng: -83.743 },
  "Carlsbad, CA": { lat: 33.1581, lng: -117.3506 },
  "Lusaka, Zambia": { lat: -15.3875, lng: 28.3228 },
  "London, United Kingdom": { lat: 51.5074, lng: -0.1278 },
  "Cologne, Germany": { lat: 50.9375, lng: 6.9603 },
  "Houston, TX": { lat: 29.7604, lng: -95.3698 },
  "Berlin, Germany": { lat: 52.52, lng: 13.405 },
  "Welshpool, Australia": { lat: -31.9505, lng: 115.8605 },
  "San Diego, CA": { lat: 32.7157, lng: -117.1611 },
  "Santa Monica, CA": { lat: 34.0195, lng: -118.4912 },
  "Merriam, KS": { lat: 39.0236, lng: -94.6936 },
  "Berck, France": { lat: 50.4058, lng: 1.5628 },
  "Portland, OR": { lat: 45.5152, lng: -122.6784 },
  "Lancaster, United Kingdom": { lat: 54.0465, lng: -2.8008 },
  "Kirkland, WA": { lat: 47.6815, lng: -122.2087 },
  "Scottsdale, AZ": { lat: 33.4942, lng: -111.9261 },
  "Virginia Beach, VA": { lat: 36.8529, lng: -75.978 },
};

export function getCoordinates(location: string) {
  return cityCoords[location] || { lat: 40, lng: 0 };
}
