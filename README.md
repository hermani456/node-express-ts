# Parking App (Node/Express/TS)

A backend application built with Node.js, Express, and TypeScript, featuring PostgreSQL database integration using Drizzle ORM.

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js**: v22.x or higher (recommended to use `nvm` and the included `.nvmrc`)
- **pnpm**: v10.x or higher (Package manager)
- **Docker**: For running the PostgreSQL database container

## Installation

1.  **Clone the repository** (if you haven't already):

    ```bash
    git clone <repository-url>
    cd node-express-ts
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

## Configuration

1.  **Environment Variables**:
    Copy the example environment file to create your local configuration:

    ```bash
    cp .env.example .env
    ```

    Update `.env` if necessary. The default values are configured to work partially with the provided `docker-compose.yml`.

    **Important**: Ensure the `POSTGRES_URL` in `.env` matches the credentials defined in the `docker-compose.yml`.

    Default `.env` values vs Docker values:
    - Docker maps port `5432` inside container to `5433` on host (to avoid conflicts with default local Postgres).
    - Ensure your `POSTGRES_URL` uses port `5433` (as seen in `.env.example`).

## Database Setup

1.  **Start the Database**:
    Run the PostgreSQL container using Docker Compose:

    ```bash
    docker compose up -d
    ```

2.  **Apply Schema**:
    Push the Drizzle schema changes to the database:
    ```bash
    pnpm drizzle-kit push
    ```

## Running the Application

### Development Mode

To start the server in development mode with hot-reloading:

```bash
pnpm dev
```

The server will typically start on port 3000 (defined in `.env`).

## Testing Endpoints

You can test the authentication flow using the following endpoints:

1.  **Create a User**
    - **URL**: `http://localhost:3000/api/auth/sign-up/email`
    - **Method**: `POST`
    - **Body** (JSON):
      ```json
      {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
      }
      ```

2.  **Login**
    - **URL**: `http://localhost:3000/api/auth/sign-in/email`
    - **Method**: `POST`
    - **Body** (JSON):
      ```json
      {
        "email": "test@example.com",
        "password": "password123"
      }
      ```
