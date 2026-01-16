# Nhà Cộng Backend API

NestJS-based REST API backend for the Nhà Cộng property rental management platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:5000`
API documentation (Swagger) will be available at `http://localhost:5000/docs`

## 📁 Project Structure

```
be-nha-cong/
├── src/
│   ├── modules/           # Feature modules (Auth, Users, Apartment, etc.)
│   ├── config/            # Configuration files
│   ├── common/            # Shared utilities (DTOs, filters, guards)
│   ├── upload/            # File upload handling
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
└── uploads/               # Uploaded files
```

## 🛠️ Available Scripts

```bash
# Development
npm run start:dev      # Start in watch mode

# Production
npm run build          # Build for production
npm run start:prod     # Run production build

# Code Quality
npm run lint           # Lint code
npm run format         # Format code with Prettier
```

## 🔧 Configuration

### Environment Variables
Key variables to check in your `.env`:
- `PORT`: Server port (default: 5000)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `JWT_SECRET`

### Database
The application uses TypeORM. In development mode, `synchronize: true` is often enabled (be careful!). For production, migrations should be used.

## 📡 API Endpoints (Key Modules)
- `/api/auth` - Authentication & Registration
- `/api/users` - User profiles
- `/api/apartments` - Apartment management
- `/api/contracts` - Rental contracts
- `/api/invoices` - Billing

For full documentation, visit the Swagger UI at `/docs`.
