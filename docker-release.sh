
#!/bin/bash

set -e

BUILD_ENV=${ENVS:-production}

make ENVS="$BUILD_ENV" build push
