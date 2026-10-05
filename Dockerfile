FROM node:22-slim
WORKDIR /usr/app
# Install dependencies before copying the source, so this layer (most of the image) is cached
# and already in Artifact Registry whenever package.json and package-lock.json haven't changed.
# A deploy then only builds and pushes the small layers below.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node", "index.js"]
