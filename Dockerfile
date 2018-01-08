FROM node:8

LABEL maintainer="created by snakebot"

WORKDIR /app/lekracore
ADD . /app/lekracore
RUN cd /app/lekracore && npm install

EXPOSE 8881 8882

ENTRYPOINT [ "npm" , "run"]
CMD [ "start" ]
