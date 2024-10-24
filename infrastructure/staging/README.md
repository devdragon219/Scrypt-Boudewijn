# Staging Deployment

create `.env` from `sample.env` (fill in `...`):


## Preparations

Get an SSH key, e.g. `marc-scrypt-iam.pem` and add it to your `~/.ssh/config` file:

```
Host operator 16.63.31.222 ec2-16-63-31-222.eu-central-2.compute.amazonaws.com
     User ubuntu
     HostName 16.63.31.222
     IdentityFile ~/.ssh/marc-scrypt-iam.pem
     IdentitiesOnly yes
```

### Ubuntu Docker Installation

    sudo apt-get update
    sudo apt-get install docker-compose docker.io
    sudo adduser $(whoami) docker
    mkdir ~/.docker

create file `/etc/docker/daemon.json`:

```json
{
    "dns": ["8.8.8.8", "9.9.9.9"],
    "default-address-pools": [
        {"base": "172.80.0.0/16", "size": 24}
    ],
    "log-level": "warn",
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "5"
    }
}
```

## On our Host

Create Kong File: `npm run build`)

Login to Docker:

```
aws ecr --profile scrypt get-login-password --region eu-central-2 \
    | docker login --username AWS --password-stdin ${DOCKER_REPOSITORY}
```

## Manually Build and Deploy

```
DOCKER_TAG=develop npm run docker:build && echo "SUCESS" || echo "FAILED"
DOCKER_TAG=develop npm run docker:push && echo "SUCESS" || echo "FAILED"
```

## Update Configuration

Copy all files to the server:

```
scp ~/.docker/config.json operator.prod.scrypt.dev:.docker/
scp infrastructure/staging/{kong.yaml,docker-compose.yaml,.env} operator.prod.scrypt.dev:infrastructure/
```

## On the Server

```
ssh operator.prod.scrypt.dev
```

Run in `docker-compose`:

```
cd infrastructure
docker-compose pull
docker-compose up -d --remove-orphans
```

Or to make sure everything is restarted and orphans are removed:

```
docker-compose up -d --force-recreate --remove-orphans
```

Clean up:
```
docker system prune -af --volumes
```

Watch it:
```
docker-compose logs -tf
```

Check the database:
```
docker-compose exec trading-db psql -h localhost -U trading -w trading
```

Disable paging:

    \pset pager off

## Issue a Certificate

Test ACME setup:

    curl http://127.0.0.1:8001/acme -d host=operator.prod.scrypt.dev -d test_http_challenge_flow=true

Issue ACME certificate:

    curl http://127.0.0.1:8001/acme -d host=operator.prod.scrypt.dev
