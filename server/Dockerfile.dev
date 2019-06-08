#base image
FROM node:10.16.0-alpine

#copy files

WORKDIR /app
COPY ./package*.json ./
#install dependencies
RUN npm install
COPY ./ ./

CMD ["npm", "run", "start"]