# BankOperations - API

API for manage bank operations. Add new, edit, split or remove existing.

Front React.JS : https://github.com/MaximeMaillet/bank-operations-front

## Demo

https://bank.deuxmax.fr

```
username : Demo
password : Demo@omeD 
```

## Deployment

copy `docker-compose.yml` and Docker directory to server

```bash
docker network create ${MONGO_NETWORK_NAME}
docker network create ${NGINX_NETWORK_NAME}
docker-compose up -d
```

## Development

```bash
nvm install
npm install
```

Generate SSH keys for JWT

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f ./keys/auth
# Don't add passphrase
openssl rsa -in ./keys/auth -pubout -outform PEM -out ./keys/auth.pub
```

Run in development (with nodemon)

```bash
docker network create ${MONGO_NETWORK_NAME}
docker network create ${NGINX_NETWORK_NAME}
docker-compose -f docker-compose.dev.yml up -d
```

## Docker Hub

https://hub.docker.com/r/deuxmax/bank-operations
