# Elikhopter

Panneau UXP pour After Effects : édition de courbes Bézier multi-keyframes.

## Structure

- `manifest.json` — manifest UXP (entrypoint panel, host AEFT).
- `client/` — UI du panneau (HTML/CSS/JS), s'exécute dans le panneau UXP.
  - `js/curve.js` — modèle de courbe (nœuds + handles, échantillonnage).
  - `js/main.js` — rendu canvas + drag des points/handles.
  - `js/bridge.js` — bascule entre mock (navigateur) et appels réels à AE.
- `host/keyframes.jsx` — script ExtendScript exécuté côté AE pour lire/écrire les keyframes.

## Développer sans relancer AE

1. **Itération UI/courbe** : ouvre `client/index.html` directement dans un navigateur
   (`npx live-server client` ou Vite). `bridge.js` détecte qu'on n'est pas dans UXP
   et bascule sur des keyframes mockées — tout le travail sur le canvas, le drag
   des points, les handles se fait ici avec hot-reload instantané.
2. **Intégration AE** : installe le plugin une fois via l'**UXP Developer Tool**
   (Add Plugin → sélectionner `manifest.json`), puis ouvre le panneau dans AE.
   Pour chaque modif, clique **Reload** dans UXP Developer Tool (pas besoin de
   relancer AE). N'utilise cette étape que pour valider le pont vers
   `host/keyframes.jsx`.
3. Le détail exact de l'appel UXP → ExtendScript dans `bridge.js` (`callHost`)
   est à ajuster selon la version du SDK UXP installée — c'est la seule partie
   à vérifier contre la doc Adobe avant un vrai test dans AE.

## Prochaines étapes possibles

- Remplacer `prop.setValueAtTime` par des vraies tangentes Bézier AE
  (`KeyframeEase`/`setTemporalEaseAtKey`) plutôt qu'un ré-échantillonnage dense.
- Sauvegarde de courbes en presets (JSON local).
