#!/usr/bin/env bash

# Export env variable
export $(egrep -v '^#' .env | xargs)

# Front build
cd $FRONT_PATH
nvm install
npm install --production
npm run build

# Clear front build + copy
cd $API_PATH
rm -rf src/front/build
cp -r $FRONT_PATH/build src/front

# Create docker image
docker build -t $DOCKER_IMAGE:latest .
docker push $DOCKER_IMAGE
