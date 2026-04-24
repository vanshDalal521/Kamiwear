# 🎌 Kamiwear Professional Backend v1.0

This is the professional-grade backend for the Kamiwear Anime E-Commerce platform. It handles authentication, orders, and professional banking simulations.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Server**:
   ```bash
   npm start
   ```
   (Server runs on http://localhost:3000)

## 🛠️ API Documentation

### Authentication (`/api/auth`)
- `POST /register`: Create account. Body: `{ name, email, password }`
- `POST /login`: Get JWT. Body: `{ email, password }`

### Orders & Banking (`/api/orders`)
- `POST /create`: Place order (Requires JWT).
  Body: 
  ```json
  {
    "items": [...],
    "total": 999,
    "paymentDetails": {
      "cardNumber": "4242...",
      "expiry": "12/26",
      "cvc": "123"
    }
  }
  ```
- `GET /history`: View order history (Requires JWT).

## ✨ Key Features
- **Luhm-verified Banking Simulation**: Professional mock payment gateway processing.
- **KamiKoin Loyalty System**: Automatic point calculation and tier upgrades (`Genin`, `Chunin`, `Jonin`, `Kage`).
- **JWT Security**: Industrial-standard session management.
- **Clean Architecture**: Decoupled routes, controllers, and models.

## 📁 Project Structure
- `server.js`: Main entry point.
- `controllers/`: Business logic.
- `routes/`: API endpoint definitions.
- `models/`: Data access layer (JSON-based for portablity).
- `middleware/`: Auth and validation.
- `data/`: Local persistent storage.
