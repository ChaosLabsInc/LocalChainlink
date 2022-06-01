FROM node:16.14 AS BUILD_IMAGE
# Create app directory
WORKDIR /code

# Install app dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
# Bundle app source
COPY ./src ./src
RUN npm run build
# remove development dependencies
RUN npm prune --production

# final docker image: 
FROM node:16-alpine
WORKDIR /code
# copy from build image
COPY package*.json ./
COPY tsconfig.json ./
COPY ./artifacts ./artifacts
COPY --from=BUILD_IMAGE /code/build ./build
COPY --from=BUILD_IMAGE /code/node_modules ./node_modules

ENV PORT 3010
ENV LOCALTERRA_HOSTNAME terrad

# curl verifies that we have access to network
RUN apk --no-cache add curl 

EXPOSE 3010
CMD ["npm", "run", "start"]
