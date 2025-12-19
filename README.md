
# RegiScan Intelligence - Phase 2.5 Migration

Echte Client/Server-Architektur (simuliert in diesem Environment, aber Node.js-ready).

## Architektur
- **Backend (`server.ts`)**: Verwaltet eine serielle Job-Queue, Rate-Limiting und Caching.
- **Frontend**: Nutzt einen `apiClient`, um mit dem Backend zu kommunizieren.

## Features
- **Serial Worker**: Live-Abrufe werden nacheinander verarbeitet, um Bot-Sperren zu vermeiden.
- **Rate-Limiting**: Global (60/h) und Pro-User (20/h) Limits.
- **Same-Day Cache**: Identische Abfragen am gleichen Tag werden sofort aus dem Cache bedient.
- **Docker-CLI Prep**: Logik für den Aufruf des Containers ist im Provider-Layer vorbereitet.

## Lokale Ausführung (Real Node)
1. Backend starten: `npx tsx server.ts` (Port 4000)
2. Frontend starten: `npm start` (Points to localhost:4000)
