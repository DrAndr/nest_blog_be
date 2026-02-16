<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
# 📝 NestJS Blog API (Auth + Notifications Demo)

A learning **production-style** project built with **NestJS**,
featuring:

-   user authentication\
-   email verification & password recovery\
-   SMTP email sending\
-   PostgreSQL & Redis integration\
-   preparation for notification microservice architecture
-   blog and image file storage

This project is designed as a **real-world backend architecture demo
**.

------------------------------------------------------------------------

# 🚀 Tech Stack

-   **NestJS**
-   **PostgreSQL**
-   **Prisma ORM**
-   **Redis (sessions / cache)**
-   **Mailpit (local SMTP testing)**
-   **Docker Compose**
-   **RebbitMq in near future**
-   Prepared for:
    -   Notification microservice\
    -   Event‑driven architecture\
    -   RabbitMQ / queues

------------------------------------------------------------------------

# 📦 Features

## Authentication

-   registration
-   login
-   logout
-   OAuth (Google / Yandex)
-   email confirmation
-   password recovery

## User

-   stored in PostgreSQL
-   sessions stored in Redis

## Email

-   SMTP sending
-   HTML templates
-   local email preview via Mailpit

------------------------------------------------------------------------

# 🐳 Running with Docker

## 1. Clone repository

``` bash
git clone <repo-url>
cd backend
```

------------------------------------------------------------------------

## 2. Create `.env`

Rename:

    .example.env → .env

------------------------------------------------------------------------

## 3. Minimum required environment variables

``` env
NODE_ENV="development"

APP_PORT=3000
APP_URL="http://localhost:${APP_PORT}"
ALLOWED_ORIGIN="http://localhost:4000" # frontend

POSTGRES_USER=root
POSTGRES_PASSWORD=pwd123
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=main
POSTGRES_URI="postgresql://root:pwd123@localhost:5433/main?schema=public"

REDIS_PASSWORD=pwd123
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URI="redis://${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}"

COOKIES_SECRET="secret"

SESSION_SECRET="secret"
SESSION_NAME="session"
SESSION_DOMAIN="localhost"
SESSION_MAX_AGE=259200000
SESSION_HTTP_ONLY=true
SESSION_SECURE=false
SESSION_FOLDER="sessions:"

MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_LOGIN=null
MAIL_PASSWORD=null
MAIL_FROM='"No Reply" <mail@gmail.com>'
```

------------------------------------------------------------------------

## 4. Variables NOT included in `.example.env`

You must provide manually:

-   SMTP production credentials\
-   Google reCAPTCHA\
-   OAuth keys

``` env
GOOGLE_RECAPTCHA_SECRET_KEY=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...
```

------------------------------------------------------------------------

## 5. Start infrastructure

``` bash
docker compose up -d
```

Services:

-   **PostgreSQL** → `localhost:5433`
-   **Redis** → `localhost:6379`
-   **Mailpit UI** → http://localhost:8025

------------------------------------------------------------------------

## 6. Install dependencies

``` bash
npm install
```

------------------------------------------------------------------------

## 7. Prisma setup

``` bash
npx prisma generate
npx prisma migrate deploy
```

------------------------------------------------------------------------

## 8. Start server

``` bash
npm run start:dev
```

API will be available at:

    http://localhost:3000

------------------------------------------------------------------------

# 📬 Email Preview

Open Mailpit:

    http://localhost:8025

You can:

-   view sent emails\
-   open HTML templates\
-   test email verification & password reset

------------------------------------------------------------------------

# 🧱 Architecture (simplified)

    Client
      ↓
    NestJS API
      ├─ Auth
      ├─ Users
      ├─ Notifier
      └─ Sessions (Redis)
            ↓
       PostgreSQL

### Planned evolution

-   notification microservice\
-   message queues\
-   scalable email delivery\
-   event‑driven architecture

------------------------------------------------------------------------

# 📖 Useful Commands

### prisma studio

``` bash
npx prisma studio
```

------------------------------------------------------------------------

# 🎯 Project Goal

Demonstrate:

-   **backend architectural thinking**
-   real infrastructure integration
-   readiness for **microservices / queues / production**

------------------------------------------------------------------------

# 👨‍💻 Author

Andrey Yanush.
