# Sondage — Voyage des 40 ans 🎉

Petit sondage pour décider du voyage (budget, dates, destination) entre Aurélie, Sarah et Candy.
On repart de zéro : chacune remplit ses critères, et la page **Résultats** calcule en direct
les fenêtres de dates qui marchent pour tout le monde, le budget commun, et les destinations
qui collent le mieux.

## Lancer en local

```bash
cd trip-survey
npm install
npm start
```

Puis ouvre http://localhost:3000 (sondage) et http://localhost:3000/results.html (résultats).

## Déployer sur Render (lien permanent)

Le projet est prêt pour Render via un **Blueprint** (`render.yaml`) qui crée
automatiquement le serveur web **et** une base Postgres gratuite. La base est
importante : sur le plan gratuit, le système de fichiers est réinitialisé à chaque
redémarrage, donc les réponses doivent vivre dans Postgres, pas dans un fichier.

1. Mettre ce dossier dans un dépôt GitHub.
2. Sur https://render.com → **New → Blueprint**, choisir le dépôt.
3. Render lit `render.yaml`, crée `trip-survey` (web) + `trip-survey-db` (Postgres),
   et injecte `DATABASE_URL`. Cliquer **Apply**.
4. L'URL publique ressemble à `https://trip-survey-xxxx.onrender.com`.
   - Sondage : `/`
   - Résultats : `/results.html`

Partage le lien aux trois dans le groupe WhatsApp.

### Stockage

- Avec `DATABASE_URL` (Render) → **Postgres**, durable.
- Sans `DATABASE_URL` (local) → fichier `data/responses.json`.

### Alternative : tunnel rapide (l'appli tourne sur ton Mac)

```bash
npx localtunnel --port 3000
# ou : cloudflared tunnel --url http://localhost:3000
```
Lien temporaire : il disparaît quand tu fermes ton Mac.

## Comment c'est calculé

- **Budget commun** = le plus bas des trois (plafond contraignant).
- **Dates** = intersection des périodes « idéales » + « possibles » de chacune, moins les
  périodes « impossibles ». Une fenêtre est marquée « idéale » si elle est préférée par tout le monde.
- **Destinations** = score pondéré : importance moyenne de vos critères × note de chaque
  destination. Les options au-dessus du budget commun sont grisées.

Les destinations et leurs notes se modifient dans `data/destinations.js`.
