FROM node:22-slim
WORKDIR /usr/app
COPY . /usr/app
RUN npm install -g @angular/cli
RUN npm install
# Leftover from the old webpack build (OpenSSL 3 workaround). Angular now builds with esbuild,
# and local builds and `node index.js` run without it, so this is likely safe to remove.
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build
EXPOSE 8080
CMD ["node", "index.js"]
