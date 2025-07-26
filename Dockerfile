FROM node:24

WORKDIR /website

COPY . .

RUN npm ci 
RUN npm run build

CMD ["node", "dist/main.js"]
