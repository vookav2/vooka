FROM jrottenberg/ffmpeg:4.1-alpine as ffmpeg

###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine as build

WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock .yarnrc.yml ./
COPY --chown=node:node .yarn .yarn

COPY --from=ffmpeg / /

RUN apk add --no-cache --virtual .gyp \
	python3 \
	make \
	g++ \
	&& ln -sf python3 /usr/bin/python

RUN yarn install --immutable --inline-builds

COPY --chown=node:node . .

ENV NODE_ENV production

RUN yarn webpack:build

RUN yarn workspaces focus --production && yarn cache clean --all && apk del .gyp

USER node

##################
# PRODUCTION
##################

FROM node:18-alpine as production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist/bundle.js .

# Copy ffmpeg
COPY --from=ffmpeg / /

CMD ["node", "bundle.js", "start-client"]