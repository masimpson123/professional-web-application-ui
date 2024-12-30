FROM node:latest
WORKDIR /usr/app
COPY . /usr/app
RUN npm install -g @angular/cli
RUN npm install
# add an environment variable to patch a webpack bug
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build
EXPOSE 8080
CMD ["node", "index.js"]
