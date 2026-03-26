FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
