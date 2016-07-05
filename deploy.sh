#!/bin/sh

# make sure key is permissive, but not too permissive
chmod 600 deploy_static.pem
# clean out any existing staging folder but make sure it exists
ssh -i deploy_static.pem formidable@192.241.218.94 "rm -rf static/spectacle-staging && mkdir -p static/spectacle-staging"
# copy the spectacle build to the staging arena; if this fails, site is still OK
scp -i deploy_static.pem -rp ./build/* formidable@192.241.218.94:/home/formidable/static/spectacle-staging
# rename the staging arena to the actual spectacle site
ssh -i deploy_static.pem formidable@192.241.218.94 "rm -rf static/spectacle && mv static/spectacle-staging/ static/spectacle"
