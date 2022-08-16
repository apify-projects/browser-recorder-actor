FROM node:16-alpine as first_layer

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . /app

RUN npm run server:build
RUN npm run build

FROM node:16-alpine as second_layer

WORKDIR /app

EXPOSE 8080
ENV NODE_ENV=production

ENV DOCKER 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser
RUN apk add --no-cache chromium

COPY --from=first_layer /app/build /app/build
COPY --from=first_layer /app/server /app/server
COPY --from=first_layer /app/package.json package.json
COPY --from=first_layer /app/node_modules /app/node_modules
COPY --from=first_layer /app/public /app/public
COPY --from=first_layer /app/config-overrides.js /app/config-overrides.js
COPY --from=first_layer /app/src/helpers/inputHelpers.js /app/src/helpers/inputHelpers.js
COPY --from=first_layer /app/src/constants/const.js /app/src/constants/const.js
COPY --from=first_layer /app/src/shared/types.js /app/src/shared/types.js

CMD ["npm", "start"]
