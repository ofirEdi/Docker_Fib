#base image
FROM node:10.16.0-alpine as builder

#copy files

WORKDIR /app
COPY ./package*.json ./
#install dependencies
RUN npm install
COPY ./ ./


RUN npm run build

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html