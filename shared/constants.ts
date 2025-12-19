
export const API_BASE_URL = 'http://localhost:4000';
export const USE_REAL_PROVIDER = false;
export const HR_CLI_IMAGE = 'amacado/handelsregister-cli:latest';
export const HR_DOCKER_TIMEOUT_SEC = 90;

export const GLOBAL_RATE_LIMIT = 60;
export const USER_RATE_LIMIT = 20;

export const SYSTEM_BANNER = "Öffentliche Registerdaten – automatisierte Aufbereitung ohne Gewähr.";

export const ERROR_MESSAGES: Record<string, { title: string; msg: string; cta: string }> = {
  RATE_LIMIT: {
    title: "Limit erreicht",
    msg: "Das Stundenkontingent ist erschöpft. Bitte warten Sie 60 Minuten.",
    cta: "Upgrade auf Pro"
  },
  DOCKER_MISSING: {
    title: "Infrastruktur-Fehler",
    msg: "Die Docker-Engine ist nicht erreichbar oder das CLI-Image fehlt.",
    cta: "Support kontaktieren"
  },
  TIMEOUT: {
    title: "Zeitüberschreitung",
    msg: "Das Registerportal hat nicht rechtzeitig geantwortet.",
    cta: "Erneut versuchen"
  },
  UNAUTHORIZED: {
    title: "Nicht autorisiert",
    msg: "Bitte melden Sie sich an, um Abfragen zu starten.",
    cta: "Zum Login"
  },
  PROVIDER_ERROR: {
    title: "Provider-Fehler",
    msg: "Bei der Datenabfrage ist ein technischer Fehler aufgetreten.",
    cta: "Support kontaktieren"
  }
};
