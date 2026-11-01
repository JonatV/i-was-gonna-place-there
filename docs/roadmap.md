# IWGPT — I Was Gonna Place There

Nov 1, 2026 · @Jon

*Same board as you. Just better math.* La feuille de route pour construire IWGPT toi-même, chapitre par chapitre.

## Mode d'emploi

Tu construis IWGPT toi-même, en 9 chapitres : chacun t'apprend une notion, se termine par un résultat vérifiable et devient un article de blog.

**Mise en place (une fois)**

1. Crée un dossier `i-was-gonna-place-there/`, fais `git init`, ouvre-le dans VS Code.
2. Installe l'extension Claude Code dans VS Code et ouvre-la sur ce dossier.
3. Mets le fichier `CLAUDE.md` « mode mentor » à la racine du projet : il dit à Claude de ne jamais écrire le code à ta place.
4. Garde le prototype Catan Spots 0.3 installé dans Chrome : son inspecteur de messages (Alt + M) est ton outil d'observation.
5. Considère ce code 0.3 comme un corrigé scellé : tu ne l'ouvres que si tu bloques plus d'une heure sur une même chose.

**Le rythme d'un chapitre**

1. Lis les concepts et les références, puis réponds aux questions à voix haute (ou à Claude).
2. Observe dans le navigateur avant d'écrire une ligne.
3. Code l'exercice. Bloqué : demande un indice, pas une solution.
4. Coche les critères « C'est bon quand », puis fais un commit.
5. Note dans `journal.md` ce que tu as compris, ce qui t'a surpris, ce qui a cassé : c'est le brouillon de l'article.

**Règles du jeu**

- L'extension lit, elle ne joue jamais : aucun message fabriqué envoyé au serveur, aucune action automatique.
- Elle n'utilise que ce que tous les joueurs voient déjà (le plateau, les constructions).
- Le repo est public dès le premier commit : une licence (MIT par exemple), un README qui précise que le projet n'est pas affilié à colonist.io, et jamais de capture brute ni de secret dans l'historique git.
- Lis le chapitre 9 en diagonale dès le début : il donne la structure de dossiers dans laquelle ranger chaque chapitre.

## Chapitre 1 — Une extension Chrome minimale

Objectif : un script à toi qui s'exécute sur colonist.io avant le code du jeu, et un `console.log` qui le prouve.

**Concepts**

- `manifest.json` en Manifest V3 : nom, version, et la liste des `content_scripts`.
- Un content script : un fichier JS que Chrome injecte dans les pages qui correspondent à `matches`.
- `run_at: "document_start"` : ton script tourne avant ceux de la page. Ce sera vital au chapitre 2.
- Les deux « mondes » : `ISOLATED` (par défaut, ton propre `window`) et `MAIN` (le même `window` que la page).
- Charger une extension non empaquetée, puis la recharger après chaque modification.

**Questions à savoir répondre**

- Pourquoi un script du monde `ISOLATED` ne peut-il pas modifier le `WebSocket` utilisé par colonist ?
- Que se passerait-il si ton script tournait après celui du jeu ?

**Exercice**

1. Fais une extension qui logue `[CS] chargé` et la valeur de `document.readyState`.
2. Définis `window.csTest = 42` dans ton script.
3. Essaie les deux mondes. Dans la console de la page, tape `csTest` : dans quel cas la page le voit-elle ?

**C'est bon quand**

- [ ] Ton log apparaît dans la console de colonist.io, avant les logs du jeu.
- [ ] Tu sais expliquer en deux phrases la différence entre `ISOLATED` et `MAIN`.

Angle d'article : « Mon premier content script, et pourquoi le monde dans lequel il vit change tout ».

## Chapitre 2 — Comprendre et intercepter un WebSocket

Objectif : voir passer chaque message que le serveur envoie à colonist, sans que le jeu s'en aperçoive.

**Concepts**

- HTTP (une question, une réponse) contre WebSocket (une connexion ouverte dans les deux sens, après une poignée de main `Upgrade`).
- Les trames : texte ou binaire. Côté JS, le binaire arrive en `Blob` ou en `ArrayBuffer` selon `binaryType`.
- L'API : `new WebSocket(url)`, l'événement `message`, la méthode `send`.
- Le monkey-patching : remplacer `window.WebSocket` par ta propre classe qui hérite de l'originale (`class X extends WebSocket`) et ajoute un écouteur.

**Observer d'abord**

- DevTools → Network → filtre WS → clique la connexion → Messages. Combien de connexions colonist ouvre-t-il ? Vers quelles URL ?
- Le lobby envoie-t-il des messages WebSocket ? (Indice : regarde aussi les requêtes HTTP.)

**Exercice**

1. Intercepte le constructeur et logue, pour chaque message reçu : sa taille, son type JS et ses 8 premiers octets en hexadécimal.
2. Affiche un compteur de messages par seconde pendant une partie.
3. Installe volontairement ton hook trop tard (dans un `setTimeout` de 5 s) : que vois-tu ? Note pourquoi.

**Pièges**

- Une erreur levée dans ton écouteur peut casser le jeu : entoure tout de `try/catch`.
- Garde le comportement d'origine intact : mêmes arguments au constructeur, `send` qui marche toujours.

**C'est bon quand**

- [ ] Tu vois les messages défiler pendant une partie contre des bots, et le jeu marche normalement.
- [ ] Tu sais expliquer pourquoi ton hook doit être posé avant que colonist ouvre sa connexion.

Angle d'article : « Écouter la conversation entre un jeu et son serveur ».

## Chapitre 3 — Le binaire et MessagePack

Objectif : ton propre décodeur MessagePack, qui transforme les octets du chapitre 2 en objets JS lisibles.

**Concepts**

- Un octet, l'hexadécimal, l'ordre des octets (big-endian).
- `ArrayBuffer`, `Uint8Array` pour lire octet par octet, `DataView` pour lire des entiers sur 2, 4 ou 8 octets, `TextDecoder` pour l'UTF-8.
- MessagePack, c'est du JSON en binaire : chaque valeur commence par un octet « préfixe » qui annonce son type, et parfois sa longueur.
- Le décodage est récursif : une map contient des valeurs, qui peuvent être des maps.

**Pour démarrer, quatre familles suffisent**

| Préfixe (hex) | Type | La longueur ou la valeur est… |
| --- | --- | --- |
| `00` à `7f` | petit entier positif | l'octet lui-même |
| `80` à `8f` | map | les 4 bits de droite (nombre de paires) |
| `90` à `9f` | tableau | les 4 bits de droite (nombre d'éléments) |
| `a0` à `bf` | chaîne | les 5 bits de droite (nombre d'octets) |

Le reste (`c0` nil, `c2`/`c3` booléens, entiers et chaînes plus longs, `dc`/`de`…) est dans la spécification.

**Exercice**

1. Sur papier, décode `82 a2 69 64 2a a4 64 61 74 61 c3`.
2. Écris `decode(bytes)` avec les quatre familles ci-dessus, puis ajoute les autres types un par un, à mesure que tes vrais messages en ont besoin.
3. Installe la librairie de référence `@msgpack/msgpack` uniquement dans tes tests, et vérifie que ton décodeur donne le même résultat qu'elle.

**C'est bon quand**

- [ ] Ton décodeur donne exactement le résultat de la librairie de référence sur 100 messages capturés.
- [ ] Un octet inconnu provoque une erreur claire (« préfixe 0xc1 inconnu à la position 12 »), pas un plantage silencieux.

Angle d'article : « Lire du binaire à la main : écrire un décodeur MessagePack en 100 lignes ».

## Chapitre 4 — Cartographier le protocole de colonist

Objectif : écrire la documentation qui n'existe pas, un fichier `docs/protocol.md` qui dit ce que signifie chaque type de message utile.

**Concepts**

- L'enveloppe : la plupart des messages reçus ressemblent à `{ id, data: { type, payload } }`. Le `type` est un numéro.
- Snapshot et diff : au début, le serveur envoie l'état complet de la partie, puis seulement ce qui change.
- Les messages envoyés ont une autre forme : quelques octets d'en-tête, puis du MessagePack. C'est une hypothèse à vérifier toi-même.

**Méthode : une action, une observation**

1. Partie contre des bots, inspecteur ouvert, types bavards masqués.
2. Fais une seule action (lancer les dés, poser une route, une colonie).
3. Note ce qui arrive dans la seconde qui suit, et dans quel sens.
4. Exporte la capture en JSON : elle servira de données de test aux chapitres 5 à 7. Le repo est public : avant de la committer, remplace les pseudos des autres joueurs, retire le chat et tout identifiant de session. Les captures brutes restent dans un dossier ignoré par git.

**À trouver**

- Le message qui contient le plateau, et le chemin exact jusqu'aux tuiles.
- Le message envoyé quand tu lances les dés, et celui qui donne le résultat.
- Comment une construction apparaît : quel champ change, et que vaut une intersection vide ?
- Les numéros des types de tuiles et de ports (bois, brique, désert, mer…).

**Ta table du protocole (à remplir)**

| Type | Sens | Quand il arrive | Champs utiles | Confirmé ? |
| --- | --- | --- | --- | --- |
|  | reçu | début de partie |  |  |
|  | envoyé | je lance les dés |  |  |
|  | reçu | résultat des dés |  |  |
|  | reçu | quelqu'un pose une colonie |  |  |
|  | reçu | quelqu'un pose une route |  |  |

**C'est bon quand**

- [ ] Tu retrouves le plateau dans une capture en moins d'une minute.
- [ ] Au moins 5 types sont identifiés et confirmés sur deux parties différentes.

Angle d'article : « Rétro-ingénierie respectueuse : documenter le protocole d'un jeu en l'observant ».

## Chapitre 5 — Coordonnées hexagonales, coins et arêtes

Objectif : dessiner le plateau exactement comme colonist, et savoir quelles tuiles touchent chaque intersection et chaque arête.

**Concepts**

- Les trois façons de repérer des hexagones : coordonnées décalées (offset), axiales (q, r) et cubiques (q, r, s). Colonist utilise un repère axial.
- Hexagones « pointe en haut » ou « plat en haut » : ça change la formule pour passer en pixels.
- La conversion axial → pixel : chaque tuile a un centre, chaque coin est à une distance égale au rayon.
- Colonist repère une tuile par (x, y), un coin et une arête par (x, y, z). Tout l'enjeu est de comprendre ce que signifie z.

**Questions à savoir répondre**

- Un hexagone a 6 coins, mais chaque coin est partagé par 3 tuiles. Combien de coins « appartiennent » vraiment à chaque tuile ? Et combien d'arêtes ?
- Pourquoi z ne prend-il que 2 valeurs pour les coins et 3 pour les arêtes ?
- Un plateau standard de 19 tuiles a 54 intersections et 72 arêtes : peux-tu le retrouver par le calcul ?

**Exercice**

1. Dessine les 19 tuiles en SVG à partir de `tileHexStates`.
2. Ajoute un point pour chaque coin de `tileCornerStates`. Si un point ne tombe pas pile sur un sommet, ta formule pour z est fausse : c'est le test visuel.
3. Écris quatre fonctions pures : les coins d'une tuile, les tuiles d'un coin, les voisins d'un coin, les coins d'une arête.
4. Teste-les : 54 coins, 72 arêtes, chaque coin à distance égale au rayon de ses tuiles.

**C'est bon quand**

- [ ] Tous les points tombent sur des sommets, y compris au bord du plateau.
- [ ] Tes tests de géométrie passent sans dépendre du navigateur.

Angle d'article : « Les hexagones, c'est juste de la trigonométrie (et un bon repère) ».

## Chapitre 6 — Analyser les spots

Objectif : classer les 54 intersections avec un score que tu sais justifier, puis l'améliorer.

**Concepts**

- Deux dés donnent 36 combinaisons équiprobables. Le nombre de combinaisons qui donnent une somme, ce sont les « pips » (les petits points sous les numéros).
- Probabilité qu'une intersection produise au prochain lancer = somme de ses pips / 36, car deux sommes ne sortent jamais en même temps.
- Ce qu'un score simple ignore : la diversité des ressources, leur rareté sur ce plateau, les ports, le désert.

**Questions à savoir répondre**

- Pourquoi le 7 n'a-t-il pas de tuile ? Combien de pips aurait-il ?
- Une intersection 6-8-9 vaut combien de pips ? Quelle chance de produire à chaque lancer ?
- Pourquoi un 5-6-9 en blé-blé-blé peut-il être moins bon qu'un 5-6-9 en trois ressources différentes ?

**Exercice**

1. Calcule la table des pips par le raisonnement (liste les 36 lancers), pas en la recopiant.
2. Score v1 : la somme des pips. Classe les intersections et compare avec ton intuition de joueur.
3. Les combos : une fonction qui dit si une intersection touche tous les numéros d'une liste (attention aux doublons, comme 5-5).
4. Score v2 : invente une pondération (rareté, diversité, port) et écris en une phrase pourquoi.

**C'est bon quand**

- [ ] Ton classement v1 tient dans une fonction pure, testée sur un plateau dont tu connais la réponse.
- [ ] Tu peux défendre ton score v2 devant un joueur expérimenté.

Angle d'article : « Les maths derrière un bon placement de départ ».

## Chapitre 7 — Suivre la partie en direct

Objectif : un état de partie toujours juste (qui a construit quoi, où), et un classement qui retire les intersections devenues inaccessibles.

**Concepts**

- État = un snapshot, puis des diffs appliqués dans l'ordre. Un diff ne contient que les champs qui changent : il faut fusionner, pas remplacer.
- Idempotence : à une reconnexion, le serveur renvoie le snapshot. Rien ne doit être compté deux fois.
- La règle de distance : une intersection occupée bloque ses voisines directes (chapitre 5).
- Un réducteur : une fonction pure `appliquer(état, message) → nouvel état`. L'interface se redessine à partir de l'état, jamais directement à partir d'un message.

**Exercice**

1. Écris le réducteur pour le plateau et les constructions.
2. Rejoue une capture exportée au chapitre 4, message par message, dans Node, sans navigateur.
3. Compare l'état final avec une capture d'écran de la partie : mêmes colonies, mêmes villes, mêmes couleurs.
4. Ajoute la règle de distance au classement du chapitre 6.

**C'est bon quand**

- [ ] Rejouer une partie enregistrée redonne exactement les constructions visibles à l'écran.
- [ ] Rejouer deux fois le même snapshot ne change rien.
- [ ] Une colonie posée retire l'intersection et ses voisines du classement.

Angle d'article : « Snapshot + diffs : reconstruire l'état d'un jeu en direct ».

## Chapitre 8 — L'interface

Objectif : un panneau flottant avec le mini-plateau et le classement, qui ne dérange pas le jeu et que le jeu ne casse pas.

**Concepts**

- Shadow DOM : une bulle où le CSS de colonist n'entre pas, et d'où le tien ne sort pas.
- SVG et `viewBox` : dessiner dans ton propre repère (celui du chapitre 5), puis laisser le navigateur mettre à l'échelle.
- Les événements clavier remontent jusqu'au jeu : taper dans ton champ peut déclencher ses raccourcis (`stopPropagation`).
- `localStorage` pour retenir les réglages (seuil, combos, position du panneau), toujours dans un `try/catch`.
- Pointer events pour déplacer le panneau.

**Exercice**

1. Un panneau vide dans un Shadow DOM, déplaçable, masquable par un raccourci.
2. Le mini-plateau en SVG, avec les meilleures intersections colorées selon leur score.
3. La liste classée : survoler une ligne met le point correspondant en évidence sur la carte, et inversement.
4. Les réglages qui survivent à un rechargement de page.

**C'est bon quand**

- [ ] Le style de colonist n'altère pas ton panneau, et le tien n'altère pas le jeu.
- [ ] Taper dans tes champs ne déclenche aucun raccourci du jeu.
- [ ] Le panneau se met à jour seul quand l'état change (chapitre 7).

Angle d'article : « Une interface injectée qui reste polie avec la page hôte ».

## Chapitre 9 — Architecture modulaire, build et tests

Objectif : un code rangé en couches, où un seul fichier connaît le format de colonist, et où tout le reste se teste sans navigateur.

**Le principe : des couches qui ne se connaissent qu'à travers leurs frontières**

&#91;embedded content: architecture d'IWGPT · 6 couches, du serveur à l'interface\]

Le format de colonist n'entre que par l'adaptateur : tout ce qui est en dessous ne dépend que de ton modèle, et les quatre couches du milieu se testent dans Node.

**Une structure de dossiers possible**

```
i-was-gonna-place-there/
  manifest.json
  src/
    main.js              point d'entrée injecté dans la page
    transport/ws-hook.js
    codec/msgpack.js
    colonist/adapter.js  le seul fichier qui connaît colonist
    board/geometry.js
    board/analysis.js
    state/store.js
    ui/panel.js
  test/
    fixtures/            tes captures exportées (chapitre 4)
  docs/protocol.md       ta doc du protocole
  journal.md             le brouillon du blog
```

**Le build**

Un content script déclaré dans le manifest ne peut pas être un module ES : pas d'`import` en haut du fichier. Deux options : lister plusieurs fichiers dans le manifest (simple, mais dépendant de l'ordre), ou écrire de vrais modules et les assembler en un seul fichier avec esbuild. Pour un code propre et un article clair, choisis esbuild.

**Les tests**

- `node:test` (intégré à Node) ou Vitest suffisent.
- Teste les fonctions pures : décodeur, géométrie, analyse, réducteur.
- Le test le plus précieux : rejouer une capture réelle et vérifier l'état final.

**C'est bon quand**

- [ ] `npm test` est vert, sans ouvrir de navigateur.
- [ ] `npm run build` produit un dossier `dist/` que Chrome charge directement.
- [ ] `colonist/adapter.js` est le seul fichier qui contient des noms comme `tileHexStates`.

Angle d'article : « Ranger un projet d'extension pour qu'il survive aux changements du site ».

## Références et suivi

**Où chercher, chapitre par chapitre**

| Chapitre | Référence | Pour quoi |
| --- | --- | --- |
| 1 | [Chrome — clé content\_scripts](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts) | `matches`, `run_at`, `world` (MAIN ou ISOLATED) |
| 2 | [MDN — WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) | l'API, les trames, l'événement `message` |
| 3 | [Spécification MessagePack](https://github.com/msgpack/msgpack/blob/master/spec.md) | la table complète des préfixes |
| 4 | [ColonyHistorian](https://github.com/lemeryfertitta/ColonyHistorian) et [catana](https://github.com/na-ith/catana) | comment d'autres ont lu colonist (à ouvrir après tes propres observations) |
| 5 | [Red Blob Games — Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) | coordonnées axiales, conversion vers les pixels |
| 9 | [esbuild — bundle](https://esbuild.github.io/api/#bundle) et [vite-plugin-web-extension](https://github.com/samrum/vite-plugin-web-extension) | assembler des modules en un script ; pourquoi un content script n'est pas un module ES |

**Progression**

- [ ] Chapitre 1 — extension minimale
- [ ] Chapitre 2 — WebSocket
- [ ] Chapitre 3 — décodeur MessagePack
- [ ] Chapitre 4 — protocole de colonist
- [ ] Chapitre 5 — géométrie hexagonale
- [ ] Chapitre 6 — analyse des spots
- [ ] Chapitre 7 — suivi en direct
- [ ] Chapitre 8 — interface
- [ ] Chapitre 9 — architecture, build, tests
