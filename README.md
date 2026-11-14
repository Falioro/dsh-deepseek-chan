# DeepSeek Chan

DeepSeek Chan, la chibi baleine-maid, remplace Bonk sous le compositeur. Elle
reprend l'architecture du plugin `bonk` (un SVG, une feuille CSS pilotée par
`data-phase`, l'état du tour lu dans le slot) et ajoute deux choses que Bonk ne
savait pas faire : un état d'attente quand la session attend une réponse de ta
part, et une réaction au clic.

| État | Déclencheur | Ce qu'on voit |
|---|---|---|
| `sleep` | rien ne tourne | yeux fermés, respiration lente, « Zzz » qui montent, queue lente |
| `wake` | un tour démarre | petit saut, les yeux s'ouvrent (0,62 s) |
| `work` | le tour tourne | elle flotte, cheveux et queue balancent, bulles et notes qui montent |
| `wait` | le tour attend quelque chose de toi | main levée, bulle « ? » qui oscille |
| `cheer` | le tour vient de finir | elle chante, les mains claquent, étincelles (2,9 s) |
| `pet` | tu cliques sur elle | saut de joie, yeux rieurs, une phrase de baleine |

`wake` enchaîne sur `work` ou `wait` ; `cheer` retombe sur `sleep`.

## Ce qu'elle fait en plus du personnage

- **Jauge de profondeur** (à sa gauche, pendant `work` et `wait`) : un mètre
  toutes les deux secondes, plafonnée à 999 m, avec une barre qui se remplit
  sur la base de 90 m. Elle donne une idée du temps que le tour prend.
- **Tenue par session** : quatre palettes (navy, abyss, ice, sakura) choisies
  par un hachage stable de l'identifiant de session. Deux onglets ouverts ne se
  ressemblent pas. `navy` est volontairement doublée dans `OUTFITS` pour rester
  majoritaire : la baleine doit rester bleue la plupart du temps.
- **Clic** : petit saut, yeux rieurs (aucune fenêtre, aucun réseau).

## Système de notification intégré

La fin d'un tour est annoncée, sans avoir à surveiller la fenêtre :

- Un veilleur monté dans `shell.overlay` s'abonne au même instantané
  `useSessionStatus` et suit le **nombre de sessions occupées**, pas une session
  en particulier. Quand ce nombre baisse, un tour vient de finir — n'importe
  lequel, y compris celui d'une session en arrière-plan dont la pastille verte
  s'allume dans la barre latérale. Le composant ne rend rien du tout.
- Le signal est deux notes de sinus douces (sol 5 à 784 Hz, puis do 6 à
  1046,5 Hz, à 100 ms d'écart, attaque de 20 ms, décroissance de 320 ms) à
  niveau fixe. Tout le réglage tient dans une constante, `CHIME_DB` (−16 dBFS).
- Un seul carillon toutes les 1,2 s au maximum : deux tours qui se terminent
  ensemble ne sonnent pas deux fois.
- **Coupé par défaut.** Pour l'activer, ou pour la couper à nouveau, il suffit
  d'un clic droit sur elle : un seul geste bascule le son, et c'est le seul
  réglage. Le choix est retenu dans `localStorage` sous `deepseek-chan.sound`,
  et une petite pastille confirme le changement. Le premier clic sert aussi à
  débloquer l'`AudioContext` du navigateur, que les navigateurs gardent suspendu
  jusqu'à un geste utilisateur.
- Rien à installer ni à autoriser : le son est synthétisé en WebAudio. Aucune
  notification système, aucune demande de permission, aucun appel réseau.



## D'où vient l'état

L'entrée est rendue dans `conversation.composer.dock`, un slot de portée
`session`. Le slot fournit la prop standard `useSessionStatus`, dont
l'instantané est une `Map<SessionId, { running, pendingInteraction,
completionUnread }>` (service `UiSession` de `@deepseek-ai/dsh-client-ui-session`).
Le composant ne sélectionne que deux booléens — `running` et
`pendingInteraction` — donc il ne se re-rend que lorsque l'un des deux change,
jamais à chaque token.

En cas de donnée absente (session non résolue, instantané vide), les sélecteurs
répondent `false` : l'animation retombe sur `sleep` au lieu de casser.

## Détails d'implémentation

- `client.js` : un SVG (viewBox 120×120, rendu 96 px) + une feuille CSS pilotée
  par `data-phase` et `data-pet` sur le conteneur. Chaque `transform` animé est
  un `translate` : rien ne dépend de `transform-origin` dans la view box.
- Les expressions sont toutes dessinées ; c'est la phase qui choisit le jeu
  visible (`yeux ouverts / fermés / rieurs`, `bouche calme / chant`).
- La main levée de l'état `wait` est un second bras pré-dessiné, affiché à la
  place du bras au repos : pas de rotation autour d'une épaule à recalculer.
- Trois `setTimeout` (fin de `wake`, fin de `cheer`, fin de `pet`), nettoyés au
  démontage ; tout le reste est du CSS.
- `prefers-reduced-motion: reduce` fige toutes les boucles et garde la pose de
  l'état courant.
- Les phrases de caresse passent par `ctx.locale` (`locale.deepseek-chan`), donc
  elles suivent la langue active sans rechargement.
- La moitié Host (`index.js`) est vide : le bundle existe pour que le patch
  puisse insérer la ligne et que le Client soit chargé.

## Installation

```
plugin_manager install_bundle  target = <chemin absolu vers ce dossier>
```

`bonk` doit être désactivé pour éviter deux personnages sous le compositeur :

```
plugin_manager set_bundle  target = @local/bonk  enabled = false
```

## Réglages

- **Position** : `order` dans `client.js` (`0` = activity, `1` = usage,
  `5` = DeepSeek Chan).
- **Taille** : `width` / `height` du SVG (96).
- **Durées d'état** : `WAKE_MS`, `CHEER_MS`, `PET_MS`, `CHIP_MS` en haut du
  composant ; garder la durée de `cheer` cohérente avec la boucle CSS.
- **Palette** : les dégradés `chan-hair`, `chan-dress`, `chan-fin`,
  `chan-fluke`, `chan-eye` dans les `<defs>`.
- **Phrases** : les dictionnaires `EN` / `FR` du `client.js`.
- **Désactiver** : `plugin_manager set_bundle` sur `@local/deepseek-chan`.

## Piège rencontré

Une écriture du `client.js` qui échoue au chargement peut faire passer le
bundle à `enabled: false` (l'entrée disparaît alors du slot). Vérifier avec
`plugin_manager list_bundles`, puis réactiver avec
`plugin_manager set_bundle target=@local/deepseek-chan enabled=true`.

## Pistes non implémentées

- Jauge de profondeur qui se remplit avec la durée du tour.
- Cadence de la queue liée au flux de tokens plutôt qu'au booléen « ça tourne ».
- Variantes de robe par workspace ou par preset d'agent.
- Son discret à la fin du tour (désactivé par défaut).
