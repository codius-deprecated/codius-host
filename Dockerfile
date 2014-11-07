FROM dockerfile/nodejs

# Install NPM dependencies
# We do this first so that it can be cached even if the rest of the
# application changes.
ADD package.json /code/package.json
WORKDIR /code
RUN npm install --no-color

# Add rest of application
ADD . /code

ENV PORT 8080
EXPOSE 8080

CMD npm start
