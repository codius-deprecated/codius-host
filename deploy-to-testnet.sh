git clone git@github.com:codius/rippled-skynet skynet
cd skynet
git submodule update --init
chmod a-rwx,u+r keys/*
ansible-playbook -i ec2.py -e codius_version=$CIRCLE_SHA1 codius-host-docker.yml
