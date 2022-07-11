FROM node:16-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Set this to the CA Cert you generated locally with the proxy container service (or created elsewhere
# and copied into your proxy container's source via it's Dockerfile):

# Add proxy app's CA Certificate and configure Alpine Linux to trust the certificate. 
# Exact steps may vary based on the Linux distribution you're using: 
#RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*
COPY --chown=node:node ./src/oauth2-proxy/oauth2-proxy-cert.pem /usr/local/share/ca-certificates/oauth2-proxy-cert.pem
RUN update-ca-certificates
#ENV SSL_CERT_FILE=/home/node/app/lib/oauth2-proxy-cert.pem

WORKDIR /home/node/app

COPY ./src/oauth2-client/package*.json ./

RUN chown -R node:node .

USER node

RUN npm install

COPY --chown=node:node ./src/oauth2-client/ . 

# Configure certain environment variables typically needed to use a proxy:
COPY --chown=node:node ./src/oauth2-client/lib/oauth2-proxy-config.sh /etc/profile.d/oauth2-proxy-config.sh
RUN source /etc/profile.d/oauth2-proxy-config.sh
ENV ENV="/etc/profile.d/oauth2-proxy-config.sh"
#ENV NODE_EXTRA_CA_CERTS=$SSL_CERT_FILE
EXPOSE 8080

#CMD [ "/home/node/app/node_modules/.bin/nodemon", "--delay", "500ms" "index.js" ]
CMD ["node", "index.js"]