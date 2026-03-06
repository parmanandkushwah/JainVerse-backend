# JainVerse - Backend Setup

## Prerequisites
- Node.js (v14+)
- PostgreSQL database

## Environment Variables
Create a `.env` file in the `jainverse-backend` directory:

```env
PORT=5000

DB_HOST=157.245.105.188
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Oss@2025
DB_NAME=jainverse

JWT_SECRET=jainverse-secret-key-2025
JWT_EXPIRE=7d
```

## Installation & Running

1. Navigate to backend directory:
```bash
cd jainverse-backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will:
- Connect to the PostgreSQL database
- Automatically create/update all tables (users, businesses)
- Start on port 5000

## API Endpoints

### Businesses
- `GET /api/businesses` - Get all businesses (with filters)
- `GET /api/businesses/:id` - Get single business
- `POST /api/businesses` - Create business (admin)
- `PUT /api/businesses/:id` - Update business (admin)
- `DELETE /api/businesses/:id` - Delete business (admin)
- `PATCH /api/businesses/:id/verify` - Mark as verified (admin)
- `PATCH /api/businesses/:id/feature` - Mark as featured (admin)

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

---

# JainVerse - Frontend Setup

## Prerequisites
- Node.js (v14+)

## Installation & Running

1. Navigate to frontend directory:
```bash
cd jainverse-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on http://localhost:3000

## Features

✅ Business Listing Directory
✅ Category Filter
✅ City Filter  
✅ Business Profile Page
✅ WhatsApp & Call Button
✅ Jain Verified Tag
✅ Search by name/keywords
✅ Basic Admin Panel
✅ Responsive Design

## Color Theme

- **Saffron (#F59E0B)** - Heritage & Prosperity
- **Maroon (#7C1D24)** - Jain Cultural Identity  
- **Dark Blue (#1E3A8A)** - Technology & Trust
