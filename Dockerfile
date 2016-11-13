FROM makeomatic/node:7.1.0

WORKDIR /src

COPY package.json .
RUN \
  apk --update add postgresql \
  && apk add --virtual .buildDeps \
    build-base \
    python \
    git \
    curl \
    openssl \
    findutils \
    postgresql-dev \
  && npm install --production \
  && npm dedupe \
  && apk del \
    .buildDeps \
    wget \
  && rm -rf \
    /tmp/* \
    /root/.node-gyp \
    /root/.npm \
    /etc/apk/cache/* \
    /var/cache/apk/*

COPY . /src
RUN  chown -R node /src
USER node

ENV NCONF_NAMESPACE=MS_CALENDAR \
    NODE_ENV=production

EXPOSE 3000
