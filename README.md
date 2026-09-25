# IF2 – Zähler verstehen

Interaktive Unterrichtsseite der Staatlichen Feintechnikschule. Läuft ohne Installation und ohne externe Bibliotheken, auch offline über `index.html`.

**Online:** https://pirminheld.github.io/IF2_Zaehler/  
**Direkt zu Aufgaben 6–8:** https://pirminheld.github.io/IF2_Zaehler/#vergleich

## Unterrichtsbezug

- Aufgaben 3–5 des bisherigen Arbeitsblatts: vier asynchrone T-Flipflop-Zähler mit verschiedenen Taktflanken / Weiterleitungen und 2-Bit-Resetversuch.
- Aufgabe 6: synchronen und asynchronen 3-Bit-Zähler direkt gegenüberstellen. Taktleitungen, T-Werte vor der Flanke und stabile Zustände vergleichen.
- Aufgabe 7: Übergang 011 → 100 in 10-ns-Schritten. Asynchron: 011 → 010 → 000 → 100. Synchron: 011 → 100 nach 10 ns. Andere Startwerte sowie Überlauf sind auswählbar.
- Aufgabe 8: zwei synchron aufgebaute 2-Bit-Zähler mit unterschiedlicher Resetart nebeneinander. Kurzer Impuls, gehaltener Reset, Taktflanken und Ereignistabelle.

Bei den 3-Bit-Zählern ist Q1 das niederwertigste Bit; gelesen wird Q3Q2Q1. Im 2-Bit-Resetvergleich gilt wie auf dem bisherigen Blatt Q1Q0.

Die Laufzeitdarstellung nimmt für jedes Flipflop 10 ns an, ignoriert Gatter-/Leitungsverzögerungen und setzt stabile T-Eingänge vor der Flanke voraus. Reale synchrone Zähler sind nicht laufzeitfrei. Der Resetvergleich vernachlässigt Laufzeiten und setzt ausreichend lange Impulse mit Abstand zu den aktiven Flanken voraus.

## Dateien

`index.html`, `style.css`, `counter.js`, `app.js`, `compare.css`, `compare-model.js`, `compare-ui.js`, `FTS_logo.png`, `impressum.html`, `QR_Code.png`. Die frühere SVG-QR-Datei bleibt aus Kompatibilitätsgründen erhalten; verwendet wird die geprüfte PNG-Datei.

Logo und Impressum sind unverändert aus der bisherigen Seite übernommen und stimmen mit BKI2_IN_Messkette überein. Keine externen Skripte, Schriftarten oder Trackingdienste.

## Veröffentlichung

GitHub Pages: Branch `main`, Stammverzeichnis `/`. Die PNG-Datei enthält den öffentlichen Direktlink `#vergleich`. GitHub Pages liefert die statischen Dateien ohne Build-Abhängigkeiten aus.

## Prüfung

`node test.cjs` und `node test-comparison.cjs` prüfen Zählfolgen, Flanken, Überträge, Überlauf, Laufzeiten, Reset-Priorität, Bedienereignisse und Dateiverweise.
