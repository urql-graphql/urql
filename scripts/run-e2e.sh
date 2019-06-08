#!/usr/bin/env bash

cd "$(dirname "$0")"

cd ..
yarn build

cd examples/2-using-subscriptions
yarn install --frozen-lockfile
yarn run start:server &
yarn run start:client &
yarn run e2e

exitcode=$?

kill $(jobs -p)
exit $exitcode
