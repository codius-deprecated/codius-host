FROM codius/codius.org:base

# Install NPM dependencies
# We do this first so that it can be cached even if the rest of the
# application changes.
ADD package.json /code/package.json
WORKDIR /code
RUN npm install --no-color

# Add rest of application
ENV PORT 8080
ENV CONTRACTS_STORAGE /contracts/
EXPOSE 8080
VOLUME ["/contracts"]

ADD . /code

ENTRYPOINT ["/usr/local/bin/node", "bin/codius-host"]
CMD ["start"]
