FROM node:16

ARG service

WORKDIR /app/

COPY "/$service/package.json" ./

RUN set -xe; \
    npm install; \
    npm install nodemon; \
    mkdir node_modules/.cache && chmod -R 777 node_modules/.cache; \ 
    npm config set cache node_modules/.cache; \
    mkdir schemas; \
    mkdir utils; 

COPY schemas ./schemas/
COPY utils ./utils/
COPY "./$service/." ./

