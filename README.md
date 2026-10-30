# Bmp – Libero '91

Der traditionelle Bundesliga Manager Professional von 1991 in neuem Gewand: ein Fußball-Manager im Amiga-Look als Android-App.

## Spielen

1. Unter **Releases** (rechts auf der GitHub-Seite) die neueste `Libero91-….apk` aufs Handy laden.
2. Datei öffnen und installieren. Beim ersten Mal fragt Android, ob Installationen aus dieser Quelle erlaubt sind.
3. Updates genauso installieren – der Spielstand bleibt erhalten, weil jede Version mit demselben Schlüssel signiert ist.

### Im Browser spielen

Jedes Release enthält zusätzlich `Libero91-….html`: herunterladen und im Browser öffnen (PC, Tablet oder iPhone). Die Datei enthält das komplette Spiel samt Schriften und läuft ohne Internet. Spielstände werden im jeweiligen Browser gespeichert und lassen sich über Export/Import zwischen App und Browser austauschen.

## Inhalt

- Bis zu 4 Manager reihum an einem Gerät (Hotseat)
- 3 Ligen mit je 18 Vereinen, Auf- und Abstieg
- Nationaler Pokal mit 64 Teams sowie Meister-Pokal und Euro-Pokal mit Verlängerung und Elfmeterschießen
- Spielerverträge mit Verhandlung, Jugendarbeit, Alterung und Karriereende
- Editor für Vereine, Spieler und Wettbewerbe (z. B. echte Namen eintragen)
- 5 Spielstände, Export und Import als Datei
- Sound: Fans, Pfiffe, Torjubel – alles im Spiel erzeugt, läuft komplett offline
- Spieltag mit Konferenz, Ticker und animierten Torszenen (Kopfball, Fallrückzieher, Freistoß, Latte, Abseits, Eigentor …)
- Taktik, Spieleinsatz und Wechsel während des Spiels
- Kader mit Form, Kondition und Laune, Training mit 10 Bällen, 10 Trainingslager
- Transfermarkt, Stadionausbau, Bank mit Krediten, Trikot- und Bandenwerbung

Alle Vereine und Spieler sind erfunden.

## Aufbau

- `game/shell.html` – Seitenaufbau und Gestaltung
- `game/js/*.js` – die Spiellogik, nach Bereichen aufgeteilt
- `tools/build.py` – setzt alles zu einer Datei zusammen (`dist/libero91.html` und `app/src/main/assets/index.html`); mit `--embed-fonts` werden die Pixel-Schriften eingebettet
- `app/src/main/assets/index.html` – das fertig zusammengesetzte Spiel
- `app/src/main/java/.../MainActivity.java` – zeigt das Spiel bildschirmfüllend in einer WebView
- `.github/workflows/android.yml` – setzt bei jedem Push auf `main` das Spiel zusammen, bettet die Schriften ein, baut die APK und legt ein Release an

Das Spiel lässt sich auch direkt im Browser testen: `python3 tools/build.py` ausführen und `dist/libero91.html` öffnen.

`signing/libero91.jks` ist ein Hobby-Signaturschlüssel, damit Updates sich über alte Versionen installieren lassen. Für eine Veröffentlichung im Play Store sollte ein eigener, geheimer Schlüssel verwendet werden.
