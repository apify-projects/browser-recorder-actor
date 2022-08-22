FROM node:16-alpine as first_layer

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser
RUN apk add --no-cache chromium

COPY package.json ./
COPY tsconfig.json ./

RUN npm install --legacy-peer-deps

COPY . /app

RUN npm run server:build
RUN npm run build:front

FROM node:16-alpine as second_layer

WORKDIR /app

EXPOSE 8080
ENV NODE_ENV=production

ENV DOCKER 1

COPY --from=first_layer /app/build /app/build
COPY --from=first_layer /app/out /app
COPY --from=first_layer /app/package.json package.json
COPY --from=first_layer /app/node_modules /app/node_modules
COPY --from=first_layer /app/public /app/public
COPY --from=first_layer /app/config-overrides.js /app/config-overrides.js

ENV CHROMIUM_PATH /usr/bin/chromium-browser
RUN apk add --no-cache chromium

CMD ["npm", "start"]
