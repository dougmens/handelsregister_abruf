
# RegiScan Intelligence - Phase 2.5 Fix-Pack

Echte Client/Server-Architektur (Node.js + Express).

## Architektur-Updates
- **Backend (`engine.ts`)**: Der Serial Worker verwaltet die Queue. Rate-Limiting wird jetzt präzise beim Start des Abrufs gezählt.
- **Server-side PDF**: Mock-Abrufe speichern echte (Dummy-)PDFs im Dateisystem unter `data/pdfs/<sha256>.pdf`.
- **Status-Konsistenz**: Alle Jobs nutzen jetzt `queued`, `running`, `done` oder `error`.

## Features
- **Secure Streaming**: `/api/pdf/:docId` prüft die ID auf sha256-Format und streamt direkt vom Server.
- **Rate-Limiting**: Global 60/h, User 20/h. Warnschwelle bei >= 50 (Global) oder >= 16 (User).
- **Docker Prep**: Hardened RealProvider Layer für zukünftige Live-Integration.

## Lokale Ausführung
1. Backend: `cd backend && npm install && npm run dev`
2. Frontend: `cd frontend && npm install && npm start`
3. Sample PDF: Legen Sie ein PDF unter `assets/sample-pdfs/sample.pdf` ab, damit der MockProvider es nutzen kann.
