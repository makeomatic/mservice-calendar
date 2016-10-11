FROM makeomatic/node:6.5.0

WORKDIR /src

COPY package.json .
RUN \
  apk --no-cache add --virtual .buildDeps \
    build-base \
    python \
    git \
    curl \
    openssl \
  && npm install --production \
  && npm dedupe \
  && apk del \
    .buildDeps \
    wget \
  && rm -rf \
    /tmp/* \
    /root/.node-gyp \
    /root/.npm

COPY . /src
RUN  chown -R node /src
USER node

ENV NCONF_NAMESPACE=MS_CALENDAR \
    NODE_ENV=production

EXPOSE 3000
