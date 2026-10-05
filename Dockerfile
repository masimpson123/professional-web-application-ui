FROM node:22-slim
WORKDIR /usr/app
# Install dependencies before copying the source, so this layer (most of the image) is cached
# and already in Artifact Registry whenever package.json and package-lock.json haven't changed.
# A deploy then only builds and pushes the small layers below.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Leftover from the old webpack build (OpenSSL 3 workaround). Angular now builds with esbuild,
# and local builds and `node index.js` run without it, so this is likely safe to remove.
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build
EXPOSE 8080
CMD ["node", "index.js"]
