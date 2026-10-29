FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages ./packages

RUN npm ci

COPY frontend ./frontend

RUN npm run build:shared

EXPOSE 4200

CMD ["npm", "run", "start", "--workspace=app", "--", "--host", "0.0.0.0", "--port", "4200"]