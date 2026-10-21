# Bmp – Libero '91

Der traditionelle Bundesliga Manager Professional von 1991 in neuem Gewand: ein Fußball-Manager im Amiga-Look als Android-App.

## Spielen

1. Unter **Releases** (rechts auf der GitHub-Seite) die neueste `Libero91-….apk` aufs Handy laden.
2. Datei öffnen und installieren. Beim ersten Mal fragt Android, ob Installationen aus dieser Quelle erlaubt sind.
3. Updates genauso installieren – der Spielstand bleibt erhalten, weil jede Version mit demselben Schlüssel signiert ist.

## Inhalt

- 3 Ligen mit je 18 Vereinen, Auf- und Abstieg
- Meister-Pokal und Euro-Pokal mit Hin- und Rückspiel, Verlängerung und Elfmeterschießen
- Spieltag mit Konferenz, Ticker und animierten Torszenen (Kopfball, Fallrückzieher …)
- Taktik, Spieleinsatz und Wechsel während des Spiels
- Kader mit Form, Kondition und Laune, Training mit 10 Bällen, 10 Trainingslager
- Transfermarkt, Stadionausbau, Bank mit Krediten, Trikot- und Bandenwerbung

Alle Vereine und Spieler sind erfunden.

## Aufbau

- `app/src/main/assets/index.html` – das komplette Spiel (HTML, CSS, JavaScript in einer Datei)
- `app/src/main/java/.../MainActivity.java` – zeigt das Spiel bildschirmfüllend in einer WebView
- `.github/workflows/android.yml` – baut bei jedem Push auf `main` automatisch die APK und legt ein Release an

Das Spiel lässt sich auch direkt im Browser testen: `index.html` öffnen.

`signing/libero91.jks` ist ein Hobby-Signaturschlüssel, damit Updates sich über alte Versionen installieren lassen. Für eine Veröffentlichung im Play Store sollte ein eigener, geheimer Schlüssel verwendet werden.
