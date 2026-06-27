# LS45 admin — Angular 20 SPA (no SSR). Multi-stage: build the static bundle, serve it with nginx.
# Built with the `development` configuration so the browser calls the API at http://localhost:8080
# directly (the backend CORS allow-list includes http://localhost:4201).

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration development

# ---- runtime ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ls45-admin/browser /usr/share/nginx/html
EXPOSE 80
