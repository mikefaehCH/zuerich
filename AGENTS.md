# Gemeinsame Entwicklungs- und Agentenregeln – Zúrich en Navidad

- Vor dem Start die Regeln in [CLAUDE.md](CLAUDE.md) und [RELEASE_POLICY.md](RELEASE_POLICY.md) lesen, offenen PRs/Issues, Bearbeitungszustand, Main-Commit und CI-Status prüfen.
- ChatGPT/Codex ist primärer Implementierer, Claude oder ein anderer unabhängiger Reviewer prüft produktionsrelevante PRs am konkreten aktuellen HEAD.
- Alle Änderungen ausschliesslich auf Aufgabenbranches und über PRs. Kein direkter `main`-Push, kein Force-Push.
- Die ausdrückliche Auftragsfreigabe deckt Implementierung, Testing, Review, Merge, Deployment und Live-Kontrolle innerhalb des freigegebenen Umfangs ab. Technische Schritte brauchen keine zusätzliche Rückfrage.
- Keine unbestätigten Daten, Öffnungszeiten, persönlichen Empfehlungen, Foto-Lizenzen oder Reisebuchungen verändern. Inhalt sichtbar nur in Spanisch (Spanien) mit `vosotros`. Mike entscheidet persönliche Favoriten.
- Pflichtprüfungen: `node tests/cache-isolation.mjs`, `python3 tests/check.py` einschliesslich Browser- und 390-px-Regressionschecks. Fehlgeschlagene Tests sind Blocker.
- Autonomer Merge ausschliesslich bei ausdrücklichem PR-Opt-in, Routine-Pfadumfang, erfolgreicher CI aller Checks am aktuellen SHA und Einhaltung sämtlicher GitHub-Schutzregeln (siehe RELEASE_POLICY.md). Claude-Reviews sind zusätzlich und nicht blockierend.
- Bei grösseren Produkt-, Kosten-, Datenschutz-, Sicherheits- oder echten Buchungsentscheidungen separat nachfragen.
- Alle PR-Abschlusskommentare nennen Agent, Ausgangscommit, HEAD, Ergebnis, Tests, Risiken, nächsten Schritt.
