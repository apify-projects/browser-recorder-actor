# Browser Recorder Dockerfile

FROM node:16-alpine as br-actor

WORKDIR /root

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

COPY "src" "./src"
COPY "server/src" "./server/src"
COPY "public" "./public"
COPY "package.json" "./package.json"
COPY "tsconfig.json" "./tsconfig.json"
COPY "config-overrides.js" "./config-overrides.js"

RUN npm i --legacy-peer-deps .
RUN npm i -g typescript

EXPOSE 3000/tcp

ENV DOCKER 1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium

ENTRYPOINT ["npm", "start"]
