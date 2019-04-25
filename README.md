# BankOperations - API

API for manage bank operations. Add new, edit or remove existing.

Front React.JS : https://github.com/MaximeMaillet/bank-operations-front

## Demo

http://bank.deuxmax.fr

```
username : Demo

password : Demo@omeD 
```

## Install

Install node 

```bash
nvm install
```

Install dependencies 

```bash
npm install
```

Generate SSH keys

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f ./keys/auth
# Don't add passphrase
openssl rsa -in ./keys/auth -pubout -outform PEM -out ./keys/auth.pub
```

Run in production

```bash
npm start
```

Run in development (with nodemon)

```bash
npm run api-dev
```

## Docker Hub

API : https://hub.docker.com/r/deuxmax/bank-operations-api/

Front React : https://hub.docker.com/r/deuxmax/bank-operations-front

## Docker-Compose

See `docker-compose.yml` in project. Don't forget nginx file in `Docker` directory.