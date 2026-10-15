FROM php:8.4-fpm

# Installer les dépendances système et extensions PHP
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        mbstring \
        bcmath \
        zip \
        pcntl \
        opcache \
    && rm -rf /var/lib/apt/lists/*

# Installer Composer depuis son image officielle
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Définir le répertoire de Laravel
WORKDIR /var/www/html

# Lancer PHP-FPM
CMD ["php-fpm"]