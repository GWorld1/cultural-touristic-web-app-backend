# Authentication Service Documentation

## Overview
The authentication service provides user authentication and authorization functionality for the Cultural Touristic Web Application. It uses Appwrite as the backend service for user management and JWT for secure token-based authentication.

## Features
- User Registration
- User Login/Logout
- Email Verification
- Password Reset
- Profile Management
- Role-based Authorization

## API Endpoints

### Public Routes

#### Health Check
```http
GET /api/auth/health
```
Checks if the authentication service is running.

#### Register
```http
POST /api/auth/register
```
**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "phone": "string" (optional)
}
```
**Response:** 201 Created
```json
{
  "message": "User registered successfully. Please verify your email.",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

#### Login
```http
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:** 200 OK
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  },
  "token": "string",
  "sessionId": "string"
}
```

### Protected Routes
*Requires Bearer Token Authentication*

#### Get Current User
```http
GET /api/auth/me
```
**Response:** 200 OK
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "phone": "string",
    "role": "string"
  }
}
```

#### Update Profile
```http
PUT /api/auth/profile
```
**Request Body:**
```json
{
  "name": "string",
  "phone": "string"
}
```
**Response:** 200 OK
```json
{
  "message": "Profile updated successfully"
}
```

#### Logout
```http
POST /api/auth/logout
```
**Request Body:**
```json
{
  "sessionId": "string"
}
```
**Response:** 200 OK
```json
{
  "message": "Logout successful"
}
```

### Password Management

#### Request Password Reset
```http
POST /api/auth/password/reset-request
```
**Request Body:**
```json
{
  "email": "string"
}
```
**Response:** 200 OK
```json
{
  "message": "Password reset email sent"
}
```

#### Complete Password Reset
```http
POST /api/auth/password/reset-complete
```
**Request Body:**
```json
{
  "userId": "string",
  "secret": "string",
  "password": "string",
  "passwordAgain": "string"
}
```
**Response:** 200 OK
```json
{
  "message": "Password reset successful"
}
```

### Email Verification

#### Verify Email
```http
POST /api/auth/email/verify
```
**Request Body:**
```json
{
  "userId": "string",
  "secret": "string"
}
```
**Response:** 200 OK
```json
{
  "message": "Email verified successfully"
}
```

## Authentication Flow

1. **Registration:**
   - User submits registration details
   - System creates user account in Appwrite
   - System sends email verification link
   - User data is stored in database with 'user' role

2. **Login:**
   - User submits credentials
   - System validates credentials with Appwrite
   - System creates session and JWT token
   - Token contains user ID, email, and role

3. **Protected Routes:**
   - Client includes JWT token in Authorization header
   - Middleware validates token and Appwrite session
   - Request proceeds if authentication is valid

## Error Handling

### Common Error Responses

- **400 Bad Request:** Invalid input data
- **401 Unauthorized:** Invalid credentials or missing token
- **403 Forbidden:** Insufficient permissions
- **409 Conflict:** Email already exists
- **500 Server Error:** Internal server error

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Detailed error message" (optional)
}
```

## Security Features

1. **JWT Authentication:**
   - 24-hour token expiration
   - Secure token verification
   - Role-based access control

2. **Password Security:**
   - Secure password reset flow
   - Password confirmation required
   - Appwrite's built-in password hashing

3. **Session Management:**
   - Secure session handling
   - Session invalidation on logout
   - Multiple device session support

## Environment Configuration

Required environment variables:
```plaintext
APPWRITE_ENDPOINT=your_appwrite_endpoint
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_USERS_COLLECTION_ID=your_users_collection_id
JWT_SECRET=your_jwt_secret
APP_URL=your_frontend_url
```