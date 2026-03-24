# ── Stage 1 : Build Angular ───────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copier package.json en premier pour bénéficier du layer cache
COPY package*.json ./
RUN npm ci --prefer-offline

# Copier le reste du code et builder en production
COPY . .
RUN npm run build

# ── Stage 2 : Servir avec nginx ───────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copier le build Angular (dossier browser généré par le builder application)
COPY --from=build /app/dist/etat-civil-frontend/browser /usr/share/nginx/html

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
