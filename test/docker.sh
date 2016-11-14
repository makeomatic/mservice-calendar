#!/bin/bash

set -x

BIN=./node_modules/.bin
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DC="$DIR/docker-compose.yml"
PATH=$PATH:$DIR/.bin/
COMPOSE=$(which docker-compose)
MOCHA=$BIN/_mocha
COVER="$BIN/istanbul cover"
NODE=node
TESTS=${TESTS:-test/suites/*.js}
COMPOSE="docker-compose -f $DC"

# init compose
if ! [ -x "$(which docker-compose)" ]; then
  mkdir $DIR/.bin
  curl -L https://github.com/docker/compose/releases/download/1.7.1/docker-compose-`uname -s`-`uname -m` > $DIR/.bin/docker-compose
  chmod +x $DIR/.bin/docker-compose
fi

# add trap handler
# trap "$COMPOSE stop; $COMPOSE rm -f -v;" EXIT
$COMPOSE up -d

# rebuild if needed
if [[ "$SKIP_REBUILD" != "1" ]]; then
  echo "rebuilding native dependencies..."
  docker exec tester npm rebuild
fi

# clean coverage
echo "cleaning old coverage"
rm -rf ./coverage

# tests
echo "running tests"
for fn in $TESTS; do
  echo "running $fn"
  docker exec tester /bin/sh -c "$NODE $COVER --dir ./coverage/${fn##*/} $MOCHA -- $fn" || exit 1
done

# coverage report
echo "started generating combined coverage"
docker exec tester node ./test/aggregate-report.js

echo "uploading coverage report from ./coverage/lcov.info"
if [[ "$CI" == "true" ]]; then
  $BIN/codecov -f ./coverage/lcov.info
fi
