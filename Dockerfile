FROM dockerfile/nodejs
RUN mkdir /root/.ssh
RUN echo "StrictHostKeyChecking no" >> /root/.ssh/config
RUN chmod 600 /root/.ssh/config
ADD . /code
WORKDIR /code
RUN ssh-agent bash -c 'ssh-add dot-ssh/github-deploy-key ; npm install'
RUN npm ls
CMD node app.js