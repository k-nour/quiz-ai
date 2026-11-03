# Dockerfile (frontend)
# Construit une image Node.js pour lancer le serveur de développement Vite.
# (Pour la production, on ferait un "npm run build" servi par nginx, ici on reste en mode dev pédagogique.)

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
