# ecs-first-container-webinar

The foundation for this was the [aws-cdk-nyan-cat](https://github.com/nathanpeck/aws-cdk-nyan-cat) repo by Nathan Peck. To fully attribute that I just added it as a submodule of this project rather than fork it. I also show a more complex local development example based on the [top-spring-boot-docker](https://github.com/spring-guides/top-spring-boot-docker) from Spring which I have also added a a submodule for the same reason.

I added a local dev experience, Docker Desktop to ECS as well as Copilot deployment option for the same artifact to round out the other demos for my webinar.

Run `git submodule update --init --recursive` to bring in the submodules.

## Local Docker Demo

### Example of nginx and then nginx serving nyancat

```
docker run --rm -d -p 8081:80 --name nginx nginx:alpine
# Show http://localhost:8081 with the default nginx page
docker ps
docker stop nginx
# Now let's customise that with our own content
cd aws-cdk-nyan-cat/nyan-cat
cat Dockerfile
docker build -t nyancat .
docker history nyancat
# Show the upstream nginx:alpine plus our new layer
docker run --rm -d -p 8081:80 --name nyancat nyancat:latest
# Show nyancat running on http://localhost:8081
# Show docker exec-ing into a container
docker exec -it nyancat /bin/sh
cd /usr/share/nginx/html
ls
cat index.html
exit
# Let's leave that running for now
```

### Spring boot example

### Prereqs
This sets up the local development environment and builds the JAR for our example in Ubuntu/WSL.

TODO: Document how to install Maven and OpenJDK for the Mac

```
sudo apt update && sudo apt install maven default-jdk -y
cd ~/ecs-first-container-webinar/top-spring-boot-docker/demo
./mvnw install -DskipTests
cp target/docker-demo-0.0.1-SNAPSHOT.jar ~/ecs-first-container-webinar/simple-spring-demo/
```
### Basic example (put our existing JAR in the OpenJDK container)

```
cd ~/ecs-first-container-webinar/simple-spring-demo
# Show our JAR running locally on laptop
java -jar docker-demo-0.0.1-SNAPSHOT.jar
# Now let's build the Docker container
cat Dockerfile
docker build -t spring .
docker run --rm -p 8080:8080 spring
# Explain how this is a foreground rather than background/daemon mode without the -d
# And how this lets you both see the STDOUT logs and ctrl-c to exit it
# Show http://localhost:8080
```

### Example of building the app with docker build

Prereqs:
* Do the `docker build -t spring .` before the demo to pre-cache the maven step which takes quite awhile
* Run `docker build -t root-in-docker-vm .` in root-in-docker-vm folder

```
cd ~/ecs-first-container-webinar/top-spring-boot-docker/demo
# Show the Dockerfile in an editor and explain
# Do the build that compiles the JAR in another stage - no maven/JVM required on machine!
# The maven build also caches all the maven stuff that was pulled down so subsequent builds are fast
# Show spring-build-time-differences.txt for the time difference
docker build -t spring .
docker run --rm -d -p 8080:8080 --name spring spring
# Show the container running as a process in the Docker VM
docker run --rm -it --privileged --pid=host root-in-docker-vm
# This is the equivilent of SSHing to the server that containers are running on as root - you can see all the processes with ps
ps aux | grep "nginx\|java"
exit
```

## Docker Desktop Compose Demo

Preqs:
* Create an ECR repository in the AWS Console with the name nyancat-docker
* Update the docker-compose.yml with your ECR repo details
* Update the docker-compose.yml with your Route53 zone and ACM cert details - or remove the x-aws-cloudformation block and show a HTTP on 80 with ALB DNS name example instead
* Get your AWS CLI working with an appropriate role via environment variables and then run the following commands:

```
cd ~/ecs-first-container-webinar/docker-desktop-demo
docker context create ecs myecscontext
# Choose AWS environment variables (pasted in from Isengard/AWS SSM)
docker context ls
docker compose up
# Go to http://localhost:8080 and show it is running on laptop
# Log into ECR to be able to push our image
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 505070718513.dkr.ecr.ap-southeast-2.amazonaws.com
docker-compose build
docker-compose push
docker context use myecscontext
export AWS_DEFAULT_REGION=ap-southeast-2
docker compose up
docker compose ps
# Explain there is also an alias from nyancat-docker.jasonumiker.com to this LB address
# Go to https://nyancat-docker.jasonumiker.com and show it working
```

## Copilot Demo

Preqs:
* [Install Copilot](https://aws.github.io/copilot-cli/docs/overview/#installing)
* Get your AWS CLI working with an appropriate role via environment variables and then run the following commands:

```
copilot app init --domain jasonumiker.com
# Enter Application name: nyancat
copilot init
# Choose Load Balanced Web Service
# Name it www
# Choose to enter custom path for Dockerfile and enter aws-cdk-nyan-cat/nyan-cat/Dockerfile
# Press enter to accept port 80
# Enter y for deploying a test environment
# Once it finishes load https://www.test.nyancat.jasonumiker.com
# Show off how it is HTTPS and the DNS naming convention
```

## CDK Demo

Prereqs:
* Install node, npm and typescript
* Sign in to the AWS CLI such that commands run then:

```
cd ~/ecs-first-container-webinar/aws-cdk-nyan-cat/cdk
cp ../../cdk-https-example/package.json .
cp ../../cdk-https-example/cdk-stack.ts lib
npm install
npm run build
cdk deploy
```

(Optional) Update to the latest verison of the CDK:
```
cd ~/ecs-first-container-webinar/aws-cdk-nyan-cat/cdk
sudo npm install -g npm-check-updates
ncu -u
```