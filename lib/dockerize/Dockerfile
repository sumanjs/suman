
# start with this image as a base
FROM node:7

RUN apt-get update && \
      apt-get -y install sudo

RUN sudo apt-get install -y sqlite3 libsqlite3-dev
RUN sudo chmod -R 777 $(npm root -g)

RUN npm config --global set color false
RUN npm --global set progress=false
RUN npm set progress=false

RUN apt-get -y install curl
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash

RUN . /root/.nvm/nvm.sh && nvm install 8 && nvm use 8

RUN sudo echo "docker ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

#RUN useradd -ms /bin/bash newuser
RUN useradd -ms /bin/bash docker && echo "docker:docker" | chpasswd && adduser docker sudo

USER docker
WORKDIR /home/docker

COPY package.json .
RUN npm install --log-level=warn

RUN echo "reinstalling 3"
RUN npm install --only=production -g "github:sumanjs/suman#rebase_branch"

RUN echo "rebuilding 1"
COPY . .

#CMD ["node","/usr/src/app/node_modules/suman/cli.js"]

ENTRYPOINT ["suman"]

#ENTRYPOINT ["sudo","suman"]



