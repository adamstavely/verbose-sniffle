FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY dist ./dist

ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/app.js"]

