FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages ./packages

RUN npm ci

COPY backend ./backend
COPY frontend ./frontend

RUN npm run build:shared
RUN npm run compile --workspace=backend

FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/packages ./packages

COPY backend/queries/migrations ./backend/queries/migrations
COPY backend/entrypoint.sh ./backend/entrypoint.sh

EXPOSE 3000

CMD ["sh", "backend/entrypoint.sh"]
