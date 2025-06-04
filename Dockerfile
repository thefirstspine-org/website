FROM node:20

WORKDIR /website

COPY . .

RUN npm ci 
RUN npm run build

CMD ["node", "dist/main.js"]