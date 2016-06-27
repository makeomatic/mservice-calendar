#!/bin/bash

while ! curl -s crateio:4200 > /dev/null
do
    >&2 echo "waiting for crate"
    sleep 3
done

npm test