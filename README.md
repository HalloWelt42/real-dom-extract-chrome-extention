# DOM Extractor Pro

**Webseiten-Inhalte sauber extrahieren und für KI-Verarbeitung aufbereiten.**

Wer regelmäßig Webseiten-Inhalte an KI-Sprachmodelle übergibt, kennt das Problem: Copy-Paste liefert entweder zu viel (JavaScript, CSS, SVG-Ballast, Tracking-Code) oder zu wenig (Tabellenstruktur geht verloren, Überschriften verschwinden). DOM Extractor Pro löst das - ein Klick, sauberer Output, fertig.

---

## Warum?

Moderne Webseiten bestehen zu über 80% aus Code, der für KI-Verarbeitung irrelevant ist: JavaScript-Frameworks, CSS-Styles, SVG-Icons, Tracking-Pixel, Data-Attribute, verschachtelte Container. Wenn du diesen Overhead manuell entfernst, verlierst du Zeit. Wenn du ihn nicht entfernst, verschwendest du Tokens.

DOM Extractor Pro arbeitet direkt mit dem echten, im Browser gerenderten DOM - nicht mit dem Quelltext. Das bedeutet: auch dynamisch erzeugte Inhalte (Single Page Apps, AJAX-Nachladen, JavaScript-generierte Tabellen) werden korrekt erfasst.

---

## Features

### Erfassung
- **Element-Picker** - Visuell ein Element auf der Seite auswählen (uBlock-Style)
- **Textmarkierung** - Markierten Text erfassen
- **Ganze Seite** - Kompletter DOM mit allen dynamischen Inhalten
- **Smart-Extrakt** - Automatische Hauptinhalt-Erkennung (Readability-Heuristik)

### Ausgabeformate
- **Clean HTML** - Bereinigtes HTML mit Struktur
- **Markdown** - Tabellen als Pipe-Tabellen, Überschriften als #-Notation
- **Reiner Text** - Nur sichtbarer Text, Tabellen Tab-separiert
- **JSON** - Strukturierter Baum, Tabellen als Arrays mit Header-Keys

### Filter (11 konfigurierbar)
- JS & Events entfernen
- CSS & Styles entfernen
- SVG & Canvas entfernen
- Bilder entfernen (oder durch Alt-Text-Platzhalter ersetzen)
- Data-Attribute (data-*, aria-*, role)
- Leere Tags nach dem Filtern
- Navigations-Links (Breadcrumbs, Paginierung)
- Formulare (Input, Select, Button)
- Verschachtelte Container flachklopfen
- Doppelte Textblöcke entfernen
- Whitespace normalisieren

### Profile
- **KI-Optimiert** - Maximale Bereinigung, Markdown, alle Filter aktiv
- **Entwickler** - HTML-Struktur erhalten, nur JS/CSS entfernt
- **Minimal** - Keine Filter, DOM wie er ist
- **Eigenes** - Speichert deine manuellen Einstellungen

### Weitere Features
- **Vorschau** - Ergebnis in neuem Tab prüfen (HTML gerendert + Quellcode)
- **Snapshots** - Bis zu 10 Extraktionen speichern, laden und löschen
- **Dark/Light Theme**
- **Max. Zeichen** - Ausgabelänge begrenzen
- **Mehrsprachig** - Deutsch und Englisch
- **Rechtsklick-Menü** - Schnellzugriff auf Extraktion

---

## Installation

### Chrome Web Store
*(Link folgt nach Veröffentlichung)*

### Manuell (Entwicklermodus)
1. Repository klonen: `git clone https://github.com/HalloWelt42/real-dom-extract-chrome-extention.git`
2. `chrome://extensions` öffnen
3. Entwicklermodus aktivieren (oben rechts)
4. "Entpackte Erweiterung laden" klicken
5. Projektordner auswählen

---

## Datenschutz

- Keine Daten werden gesendet
- Kein Tracking, keine Werbung
- Keine externen Bibliotheken oder CDNs
- Funktioniert vollständig offline
- Open Source

Details: [PRIVACY.md](PRIVACY.md)

---

## Projektstruktur

```
domex/
  _locales/           Übersetzungen (de, en)
    de/messages.json
    en/messages.json
  shared/             Geteilte Scripte
    i18n.js
  store/              Store-Assets (nicht im Repo)
    screenshots/de/
    screenshots/en/
  manifest.json       Extension-Konfiguration (MV3)
  popup.html/js       Hauptinterface
  content.js          Content Script (Picker, Extraktion)
  picker.css          Picker-Overlay Styles
  preview.html/js     Vorschau-Seite
  donate.html/js      Spendenseite
  help.html           Anleitung
  icons.js            SVG-Icons (FontAwesome Free)
  background.js       Service Worker
  icon*.png           Extension-Icons
```

---

## Lizenz

Nicht-kommerzielle Nutzung -- Details in [LICENSE](LICENSE)

Erlaubt:
- Persönliche Nutzung
- Private Änderungen für eigenen Gebrauch
- Forks auf GitHub (mit Quellenangabe)
- Pull Requests

Nicht erlaubt:
- Kommerzielle Nutzung
- Veröffentlichung in Extension-Stores
- Entfernung von Copyright-Hinweisen

---

## Unterstützen

- [Ko-fi](https://ko-fi.com/HalloWelt42)
- Bitcoin: `bc1qnd599khdkv3v3npmj9ufxzf6h4fzanny2acwqr`
- Dogecoin: `DL7tuiYCqm3xQjMDXChdxeQxqUGMACn1ZV`
- Ethereum: `0x8A28fc47bFFFA03C8f685fa0836E2dBe1CA14F27`

---

DOM Extractor Pro - © 2026 HalloWelt42
