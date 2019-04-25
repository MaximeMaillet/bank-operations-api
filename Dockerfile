FROM node:10.15.3

RUN mkdir -p /var/app
ADD . /var/app
RUN chown -R node:node /var/app

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

WORKDIR /var/app

USER node
RUN npm i --production

CMD /wait && npm start