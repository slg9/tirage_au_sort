# 🎡 Tirage au Sort — Fortune Wheel

Application Next.js de tirage au sort multi-cycles avec une roue de la fortune animée.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Fonctionnalités

- **Import CSV** : importez vos participants via glisser-déposer ou parcourir
- **Drag & drop** : répartissez les participants dans des groupes visuellement
- **Multi-cycles** : configurez plusieurs cycles séquentiels (les gagnants du cycle N alimentent le cycle N+1)
- **Mode sous-groupes** : divisez manuellement les gagnants entre plusieurs groupes au cycle suivant
- **Roue de la fortune** : animation premium avec clapet, segment illuminé, pointeur doré (≤ 20 participants)
- **Mode shuffle** : animation de cartes façon machine à sous (> 20 participants)
- **Vue bracket** : visualisation arborescente de tous les cycles et résultats
- **Sons** : synthèse audio Tone.js (tic de roue, ding de révélation, fanfare)
- **Haptique** : vibrations sur mobile
- **Plein écran** : mode présentation (touche F)
- **Persistance** : état sauvegardé en localStorage, restauré au rechargement

## Cas de test principal

1. Importer `/public/sample.csv` (32 participants)
2. Cliquer "Auto-répartir" → 8 groupes → 4 par groupe
3. Laisser 1 gagnant par groupe du cycle 1
4. Ajouter un cycle 2 (8 gagnants → winnersCount = 4)
5. Démarrer → lancer le cycle 1 → 8 roues tournent séquentiellement
6. Cliquer "Lancer le tirage final" → grande roue avec 8 segments
7. 4 gagnants successifs révélés → Écran 🏆

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + glassmorphism
- Framer Motion, Zustand, dnd-kit, Papaparse, canvas-confetti, Tone.js, Lucide React
