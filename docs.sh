#!/bin/bash

set -e

if [ x"$BRANCH_NAME" == x"master" ] && [ x"$SEMAPHORE" == x"true" ]; then
  git config user.email "semaphore@makeomatic.co"
  git config user.name "semaphore"
  yarn doc
  touch ./docs/.nojekyll
  git add -f ./docs
  git commit -m "docs($SEMAPHORE_BUILD_NUMBER): updated remote public documentation"
  git push origin `git subtree split --prefix docs master`:gh-pages --force
fi
