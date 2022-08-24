FROM node:16-alpine as first_layer

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

RUN npm install --legacy-peer-deps

COPY /server /app/server
COPY /src /app/src
COPY /public /app/public
COPY /config-overrides.js /app/config-overrides.js

RUN npm run server:build
RUN npm run build:front

FROM node:16-alpine as second_layer

EXPOSE 8080/tcp

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

ENV DOCKER 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium

COPY --from=first_layer /app/build /app/build
COPY --from=first_layer /app/out /app
COPY --from=first_layer /app/package.json package.json
COPY --from=first_layer /app/public /app/public
COPY --from=first_layer /app/node_modules /app/node_modules
COPY --from=first_layer /app/config-overrides.js /app/config-overrides.js

CMD ["npm", "start"]
