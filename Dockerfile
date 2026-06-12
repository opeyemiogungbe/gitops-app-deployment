FROM node:20-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY app ./app

EXPOSE 80
CMD ["node", "app/index.js"]
