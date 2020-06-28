FROM node:14

COPY . .

RUN npm install -g typescript
RUN npm run build