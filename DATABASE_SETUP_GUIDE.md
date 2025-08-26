# Database Setup Guide for Secure Gate Access System

## Overview
This guide provides instructions for setting up the PostgreSQL database for the Secure Gate Access system after migrating from Supabase to a self-hosted database.

## Prerequisites
- PostgreSQL 14+ installed locally or accessible
- Node.js and npm installed
- Prisma CLI installed (`npm install -g prisma`)

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/secure_gate_db"

# JWT Secret for Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
PORT=4001
NODE_ENV=development

# Optional: Redis for caching (if using)
REDIS_URL="redis://localhost:6379"
```

## Database Setup Steps

### 1. Install PostgreSQL
If you don't have PostgreSQL installed:

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or use Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database and User
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE secure_gate_db;

-- Create user (optional, can use postgres user for development)
CREATE USER secure_gate_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE secure_gate_db TO secure_gate_user;
```

### 3. Run Prisma Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Optional: Seed database with initial data
npx prisma db seed
```

### 4. Verify Database Connection
```bash
# Test database connection
npx prisma db pull

# View database schema
npx prisma studio
```

## Docker Setup (Alternative)

If you prefer using Docker, add this to your `docker-compose.yml`:

```yaml
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: secure_gate_db
      POSTGRES_USER: secure_gate_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres_data:
```

Then update your `.env` file:
```env
DATABASE_URL="postgresql://secure_gate_user:your_password@localhost:5432/secure_gate_db"
```

## Database Schema

The system uses the following main tables:
- `User` - User accounts and authentication
- `Profile` - User profile information
- `AccessCode` - Generated access codes for gate entry
- `AccessLog` - Log of all access attempts
- `SecurityIncident` - Security incident tracking
- `Invitation` - Visitor invitation management
- `Visitor` - Visitor information

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure PostgreSQL is running
2. **Authentication failed**: Check username/password in connection string
3. **Database doesn't exist**: Run the CREATE DATABASE command
4. **Prisma migration errors**: Delete `prisma/migrations` folder and restart

### Connection Testing

Test your connection with:
```bash
# Using psql
psql -h localhost -U secure_gate_user -d secure_gate_db

# Using Prisma
npx prisma db execute --file ./prisma/test-connection.sql
```

## Production Considerations

For production deployment:
- Use environment-specific database instances
- Enable SSL connections
- Set up database backups
- Configure connection pooling
- Monitor database performance

## Next Steps

After database setup:
1. Start the development server: `npm run dev:api`
2. Test API endpoints
3. Run integration tests: `npm run test:integration`
4. Verify all functionality works with the new database
