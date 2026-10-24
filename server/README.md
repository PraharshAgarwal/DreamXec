# API Documentation

This document provides details about all available endpoints in the backend API.

## Authentication Routes

Base path: `/auth`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/verify-email` | Verify user's email | Public |
| GET | `/me` | Get current user's profile | Protected |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password with token | Public |
| GET | `/google` | Initiate Google OAuth login | Public |

## Project Routes

Base path: `/projects`

### Public Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/public` | Get all public projects | Public |
| GET | `/:id` | Get a specific project | Public |

### User Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/` | Create a new project | Protected (USER) |
| PUT | `/:id/my-project` | Update user's project | Protected (USER) |
| DELETE | `/:id/my-project` | Delete user's project | Protected (USER) |

### Admin Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/admin/all` | Get all projects | Protected (ADMIN) |
| PATCH | `/:id/verify` | Verify a project | Protected (ADMIN) |

## Donation Routes

Base path: `/donations`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/create-payment-intent` | Create a payment intent | Protected |

## User Routes

Base path: `/users`

### User Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/me` | Get current user's details | Protected |

### Admin Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all users | Protected (ADMIN) |
| PATCH | `/:id/suspend` | Suspend a user | Protected (ADMIN) |

## Webhook Routes

Base path: `/webhook`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/payment-success` | Handle Stripe payment webhook | Public |

## Authentication

- **Protected** routes require a valid JWT token in the Authorization header
- **USER** role is required for user-specific operations
- **ADMIN** role is required for administrative operations

## Request Validation

All POST and PUT requests are validated using specific validation schemas before processing.