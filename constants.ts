
// Import Company type for MOCK_COMPANIES constant
import { Company } from './types';

export const USE_REAL_PROVIDER = false; // Feature Flag
export const HR_CLI_IMAGE = 'amacado/handelsregister-cli:latest';
export const HR_DOCKER_TIMEOUT_MS = 90000;

export const GLOBAL_RATE_LIMIT = 60;
export const USER_RATE_LIMIT = 20;
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const SYSTEM_BANNER = "Öffentliche Registerdaten – automatisierte Aufbereitung ohne Gewähr.";

// Added missing sample PDF URL for mock and development results
export const SAMPLE_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

// Added missing mock company data for search functionality
export const MOCK_COMPANIES: Company[] = [
  { id: '1', name: 'TechFlow GmbH', hrb: 'HRB 12345', court: 'Berlin (Charlottenburg)', address: 'Innovationsweg 42, 10115 Berlin', status: 'active' },
  { id: '2', name: 'GreenEnergy AG', hrb: 'HRB 67890', court: 'München', address: 'Solarstraße 7, 80331 München', status: 'active' },
  { id: '3', name: 'Global Logistics SE', hrb: 'HRB 11223', court: 'Hamburg', address: 'Hafenallee 100, 20457 Hamburg', status: 'inactive' }
];

export const ERROR_MESSAGES: Record<string, { title: string; msg: string; cta: string }> = {
  RATE_LIMIT: {
    title: "Limit erreicht",
    msg: "Ihr Stundenkontingent ist erschöpft. Bitte warten Sie 60 Minuten.",
    cta: "Upgrade auf Pro"
  },
  DOCKER_MISSING: {
    title: "Infrastruktur-Fehler",
    msg: "Die Abruf-Engine (Docker) ist aktuell nicht erreichbar.",
    cta: "Support kontaktieren"
  },
  TIMEOUT: {
    title: "Zeitüberschreitung",
    msg: "Das Registerportal antwortet nicht rechtzeitig.",
    cta: "Erneut versuchen"
  },
  UNAUTHORIZED: {
    title: "Sitzung abgelaufen",
    msg: "Bitte melden Sie sich erneut an.",
    cta: "Zum Login"
  }
};
