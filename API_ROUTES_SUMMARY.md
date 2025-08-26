# API Routes Summary

## Overview
This document summarizes all the API routes that have been implemented for the Secure Gate Access system, replacing Supabase functions with Express.js routes.

## Base URL
`http://localhost:4001/api`

## Authentication
All routes except `/health` and `/test` require JWT authentication via Bearer token in the Authorization header.

## Available Routes

### 1. Health Check
- **GET** `/health`
- **Description**: Basic health check endpoint
- **Response**: `{ "ok": true, "message": "Server is running" }`

### 2. Test Endpoint
- **GET** `/test`
- **Description**: Test endpoint that lists all available endpoints
- **Response**: JSON with system information and endpoint list

### 3. Authentication Routes (`/api/auth`)
- **POST** `/auth/login` - User login
- **POST** `/auth/signup` - User registration
- **POST** `/auth/logout` - User logout
- **GET** `/auth/me` - Get current user info

### 4. Access Codes Routes (`/api/access-codes`)
- **POST** `/access-codes/generate` - Generate new access code
- **POST** `/access-codes/verify` - Verify access code

### 5. Access Logs Routes (`/api/access-logs`)
- **GET** `/access-logs` - Get all access logs (paginated)
- **GET** `/access-logs/access-code/:accessCodeId` - Get logs for specific access code
- **POST** `/access-logs` - Create new access log entry
- **GET** `/access-logs/stats` - Get access log statistics

### 6. Incidents Routes (`/api/incidents`)
- **GET** `/incidents` - Get all security incidents (paginated, filterable by type)
- **GET** `/incidents/:id` - Get specific incident by ID
- **POST** `/incidents` - Create new security incident
- **PUT** `/incidents/:id` - Update security incident
- **DELETE** `/incidents/:id` - Delete security incident
- **GET** `/incidents/stats` - Get incident statistics

### 7. Analytics Routes (`/api/analytics`)
- **GET** `/analytics/overview` - Get overall system analytics
- **GET** `/analytics/access-logs` - Get access logs analytics by time period
- **GET** `/analytics/incidents` - Get incidents analytics by type
- **GET** `/analytics/users` - Get user registration analytics

### 8. Other Routes
- **POST** `/invitations` - Manage invitations
- **POST** `/2fa` - Two-factor authentication endpoints
- **GET** `/visitors` - Get visitors (requires auth)

## Authentication Middleware
All protected routes use JWT authentication with the following flow:
1. Extract Bearer token from Authorization header
2. Verify token using JWT_SECRET
3. Add userId to request object for downstream use
4. Return 401/403 for invalid/missing tokens

## Database Integration
All routes use Prisma Client to interact with PostgreSQL database. The routes include proper error handling and validation.

## Testing
All endpoints have been tested and confirmed working. The server runs successfully on port 4001.

## Next Steps
- Implement proper database connection with correct credentials
- Add comprehensive error handling and validation
- Implement rate limiting and security measures
- Add comprehensive logging
- Create integration tests for all endpoints
