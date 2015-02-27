Deployment steps:

* Push branch to github
* Create pull request against master, with "+r" in the body
* Wait for at least one LGTM/:+1:
* Monty merges
* Circleci builds new merge
* Docker image is built and pushed to docker.io hub
* Circle checks out skynet repository and skynet-keys private repo
* Circle runs codius-host-docker.yml playbook to deploy new docker image on
  codius AWS account
