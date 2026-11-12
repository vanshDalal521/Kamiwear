# 🛠️ Kamiwear Backend & Banking Requirements

This document outlines the professional backend and banking functions required for the Kamiwear e-commerce platform.

## 1. Core Backend Architecture
- **Environment**: Node.js with Express.js
- **Database**: Initial implementation using JSON-based storage for low-overhead, expandable to MongoDB/PostgreSQL.
- **Security**: 
  - JWT (JSON Web Tokens) for user session management.
  - Password hashing via `bcrypt`.
  - Input validation for all API endpoints.

## 2. User Authentication
- `POST /api/auth/register`: Create a new user with email, password, and basic profile.
- `POST /api/auth/login`: Authenticate user and return a JWT.
- `GET /api/auth/profile`: Retrieve the authenticated user's profile and KamiKoin balance.

## 3. Product & Inventory Management
- `GET /api/products`: Fetch all products with filtering (anime series, category, price).
- `GET /api/products/:id`: Get detailed info for a single product.
- `PATCH /api/products/:id/stock`: Real-time stock updates after an order.

## 4. Order Processing
- `POST /api/orders/create`: Create a pending order from a cart.
- `GET /api/orders/:id`: Track order status.
- `GET /api/user/orders`: List of all previous orders for a user.

## 5. 💳 Banking & Payment Functions
Since this is a professional build, the payment logic must handle:
- **Transaction Simulation**: Mocking a real-world payment gateway (Stripe/Razorpay style) with success/failure states.
- **Payment Verification**: Ensuring the amount matches the order before finalizing.
- **Currency Conversion**: Handling ₹ INR to $ USD conversions if required.
- **Security**: Never store raw card data; use tokenization principles.

## 6. 🪙 KamiKoin Loyalty Logic
- **Earn Rate**: 1 KamiKoin for every 10 currency units spent (configurable).
- **Redemption**: Logic to apply KamiKoin balance as a discount at checkout.
- **Tier Progression**: Logic to upgrade user status (`Genin` → `Chunin` → `Jonin` → `Kage`) based on total lifetime spend.

## 7. Handover Instructions
- This backend should integrate seamlessly with the Vanilla JS frontend (`js/store/` and `js/pages/`).
- API base URL should be configurable (e.g., `http://localhost:3000/api`).
