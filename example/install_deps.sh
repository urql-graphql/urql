#!/usr/bin/env bash

cd ../
echo "Packing next-urql."
yarn
yarn build
yarn pack --filename next-urql.tgz
cd example
yarn install --force