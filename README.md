# RegiScan Intelligence - Phase 2.6 (RealProvider Update)

Echte Client/Server-Architektur mit Docker-Integration für Live-Abrufe.

## Architektur-Updates
- **RealProvider**: Bei `USE_REAL_PROVIDER=true` wird ein Docker-Container gestartet.
- **Volume Mount**: Das Backend mountet ein temporäres Verzeichnis (`HR_TMP_DIR`) in den Container (`/out`), um PDF-Dateien abzugreifen.
- **PDF-Persistenz**: Erzeugte PDFs werden serverseitig in `HR_STORAGE_DIR` archiviert (benannt nach sha256).
- **Serial Worker**: Strikte serielle Verarbeitung (Concurrency=1) bleibt erhalten.

## Compliance & Sicherheit
- Keine automatisierte Captcha-Umgehung.
- Strikte Rate-Limits (Global 60/h, User 20/h).
- PDF-Streaming ist Auth-geschützt und validiert docId Formate.

## Lokale Ausführung
1. **Konfiguration**: Erstelle lokal die Datei `backend/.env` und kopiere die Werte aus `backend/config.example.txt` hinein. Passe die Pfade ggf. an dein Betriebssystem an.
2. **Backend**: `cd backend && npm install && npm run dev`
3. **Frontend**: `cd frontend && npm install && npm start`
4. **Docker**: Stellen Sie sicher, dass Docker läuft und das Image `amacado/handelsregister-cli:latest` verfügbar ist.
5. **Schreibrechte**: Der User, der das Backend ausführt, benötigt Schreibrechte für `HR_TMP_DIR` und `HR_STORAGE_DIR`.

## Status-Codes
- `queued`: In der Schlange.
- `running`: Abruf läuft.
- `done`: PDF erfolgreich erzeugt und archiviert.
- `error`: Fehler (z.B. `TIMEOUT`, `PROVIDER_ERROR`, `PARSE_CHANGED`).