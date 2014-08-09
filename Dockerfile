FROM dockerfile/nodejs
ADD . /code
WORKDIR /code
RUN npm install
CMD npm start
