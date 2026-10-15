# Staylink API — AfricaBridge

Backend Laravel 13 du projet AfricaBridge.

## Prérequis

- Docker Desktop
- Git

## Installation

git clone <url-du-repo>
cd staylink-api
cp .env.example .env
docker compose up -d --build

## Initialisation

docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate

## Accès

http://localhost:8000

## Commandes utiles

docker compose up -d
docker compose down
docker compose ps
docker compose logs -f
docker compose exec app php artisan test