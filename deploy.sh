#!/bin/bash

# Capture which build we are. Travis provides in the form of:
# `GLOBAL_NUMBER.SUBBUILD_NUMBER`. We're going to want the subbuild number
# so that we can detect the "first" vs. "other" builds.
#
# Bash hackery reference for `##*.` thing:
# http://tecadmin.net/how-to-extract-filename-extension-in-shell-script/#
BUILD_SUFFIX=${TRAVIS_JOB_NUMBER##*.}
echo "BUILD_SUFFIX: ${BUILD_SUFFIX}"

# Early exit if we aren't the first build.
if [[ "${BUILD_SUFFIX}" != "1" ]]; then
  echo "Build number: ${TRAVIS_JOB_NUMBER}. Skipping deployment."
  exit 0
fi

# Otherwise, continue and do the actual deploy.
echo "Build number: ${TRAVIS_JOB_NUMBER}. Starting deployment."

# make sure key is permissive, but not too permissive
chmod 600 deploy_static.pem
# clean out any existing staging folder but make sure it exists
ssh -i deploy_static.pem formidable@192.241.218.94 "rm -rf static/spectacle-staging && mkdir -p static/spectacle-staging"
# copy the spectacle build to the staging arena; if this fails, site is still OK
scp -i deploy_static.pem -rp ./build/* formidable@192.241.218.94:/home/formidable/static/spectacle-staging
# rename the staging arena to the actual spectacle site
ssh -i deploy_static.pem formidable@192.241.218.94 "rm -rf static/spectacle && mv static/spectacle-staging/ static/spectacle"
