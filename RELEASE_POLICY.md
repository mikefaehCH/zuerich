# Zúrich – sicherer autonomer Releaseprozess

1. Ein genehmigter Entwicklungsauftrag erlaubt End-to-End-Arbeit ohne einzelne Rückfragen zu technischen Schritten. Keine eigenmächtige Ausweitung auf andere ältere PRs.
2. Branch, PR und unabhängiges Review am aktuellen HEAD. Kein Force-Push oder direkter Main-Push; Sicherheits-/Datenschutzregeln aus [CLAUDE.md](CLAUDE.md) gelten weiter.
3. Vor jedem Merge `Zuerich quality` vollständig grün: Cache-Isolation und `tests/check.py` auf Chromium, einschliesslich 390-px-Darstellung.
4. Für automatischen Merge benötigt der PR-Text die eigenständige Zeile `Autonomy-Release: true` und eine vom tatsächlichen PR-Autor unterschiedliche GitHub-Approval auf dem aktuellen HEAD. Keine `CHANGES_REQUESTED`-Reviews.
5. Der `Autonomous merge`-Runner wird nur durch erfolgreiche CI gestartet, prüft Branch/HEAD/Review/Opt-in erneut und merged mit serverseitiger SHA-Sperre. GitHub-Branchschutz wird nicht übergangen.
6. Die bestehende GitHub-Pages-Veröffentlichung aus `main` bleibt unverändert. `Production smoke` vergleicht die veröffentlichten HTML-, JS-, Service-Worker- und Manifest-Bytes mit dem ausgecheckten Commit.
7. Fehlerhafte Veröffentlichungen: unabhängige Korrektur- oder Revert-PR erstellen; Pflichtprüfungen erneut ausführen. Kein destruktiver Auto-Rollback.
8. Änderungen an persönlichen Favoriten, Inhalten ohne Quellen, kostenpflichtigen Integrationen oder Daten mit erheblichen Datenschutzrisiken nur nach zusätzlicher Produktentscheidung.
9. PR-Dokumentation: Agent, Basis-/HEAD-SHA, Ergebnis, Prüfungen, Risiko und nächster Schritt.

Grenzen: GitHub Actions ist weder autonomer Reviewer noch kontinuierlicher Entwicklungslauf. Für Review ist ein separat authentifizierter Reviewer nötig. Die bestehende GitHub-Connector-Verbindung kann die Repository-Option `allow_auto_merge` nicht umschalten. Der SHA-gesperrte Workflow ersetzt das automatische Aktivieren dieser GitHub-Option.
