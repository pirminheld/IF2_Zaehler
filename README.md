# IF2 – Zähler verstehen

Lokale Unterrichtsseite für die FTS. Zum Starten **index.html** im Browser öffnen. Kein Server, keine Installation, keine Internetverbindung und keine externen Bibliotheken erforderlich.

## Inhalte

- Vier asynchrone 3-Bit-Zähler mit T-Flipflops im Toggle-Betrieb (T = 1).
- Gemeinsamer Takt, einzelne Halbperioden / Flanken, automatischer Lauf, vier vergleichbare Signalverläufe.
- Sichtbare Zustände an Q und Q negiert (Überstrich), Ereigniskette der schaltenden Flipflops.
- Separater synchron getakteter 2-Bit-Vorwärtszähler mit wahlweise synchronem oder asynchronem aktiv-high Reset; kurzer Resetimpuls zwischen Taktflanken.

| Arbeitsblatt | Aktive Flanke | Weiterleitung | Richtung |
|---|---|---|---|
| 3b | fallend | Q | vorwärts |
| 3a | steigend | Q | rückwärts |
| 3d | fallend | Q negiert | rückwärts |
| 3c | steigend | Q negiert | vorwärts |

Q1 ist bei den 3-Bit-Zählern das niederwertigste Bit, abgelesen wird Q3 Q2 Q1. Im Reset-Bereich gilt wie auf dem Arbeitsblatt Q1 Q0. Alle Zähler starten bei 0. Der Variantenwechsel setzt die Zähler nicht zurück: Sie laufen gemeinsam am selben Takt. „Neu starten“ löscht Zustände und Verlauf. Wechsel der Resetart startet den Resetversuch neu. Die Zeitdiagramme zeigen stabile Zustände ohne reale Gatterlaufzeiten; Spalten stehen für Bedienschritte, nicht für eine kalibrierte Zeitachse. Beim kurzen Resetimpuls entstehen zwei zusätzliche Schritte bei unverändertem Takt.

## Einsatz in Woche 2 (45 Minuten)

Die Lehrkraft öffnet die Seite am Beamer. Zunächst ohne Automatik arbeiten: „Welche Stufe schaltet bei der nächsten Flanke?“ Antwort vorhersagen lassen, dann genau eine Flanke weitergehen. Im Reset-Bereich bis 2 zählen, Reset setzen und synchron/asynchron vergleichen. Die Seite ersetzt die optionale Yenka-/Digital-Demonstration im vorhandenen Stundenplan; für längeres Experimentieren die Papier-Prüfphase entsprechend ersetzen.

## Dateien / spätere Veröffentlichung

index.html, style.css, counter.js, app.js, FTS_logo.png und impressum.html zusammen hochladen. Die Seite ist für statisches Hosting einschließlich GitHub Pages vorbereitet; es wurde nichts veröffentlicht und kein Git-Remote angelegt.

Den erzeugten QR-Code als **QR_Code.svg** neben index.html ablegen und die Seite neu laden. Das Bild wird automatisch angezeigt. Solange die Datei fehlt oder nicht geladen werden kann, bleibt der Platzhalter sichtbar. Beim späteren Upload QR_Code.svg mit hochladen.

FTS-Logo und Impressum wurden aus dem vorhandenen Projekt IF1_KV-Diagramm übernommen. Das Impressum ist inhaltlich unverändert. Grundgestaltung angelehnt an dieses Projekt.

## Prüfung

Bei vorhandenem Node.js: `node test.cjs`. Die Prüfung deckt alle acht Zustände der vier Varianten, aktive/inaktive Flanken, Modulo-Überlauf, Reset-Priorität, kurze Impulse, Bedienereignisse, Verlaufslimits und lokale Dateiverweise ab. Node wird nur zur Prüfung benötigt, nicht zum Benutzen der Seite.
