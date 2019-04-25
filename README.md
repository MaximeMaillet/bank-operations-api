# Deployment

Generate SSH keys

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f ./keys/auth
# Don't add passphrase
openssl rsa -in ./keys/auth -pubout -outform PEM -out ./keys/auth.pub
```