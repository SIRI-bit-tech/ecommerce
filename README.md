# ReyVouge E-Commerce Platform

A modern, full-stack e-commerce application built with a high-performance GraphQL backend and a beautiful, responsive Next.js frontend. Features include secure authentication, real-time updates, integrated payment processing, and a comprehensive admin dashboard.

## 🌟 Key Features

- **Storefront**: Browse products by category, view detailed product pages with variants (size/color), and manage cart & wishlist.
- **Secure Authentication**: Passwordless or credential-based login powered by Better Auth.
- **Payment Processing**: Integrated Flutterwave checkout for secure and localized payments.
- **Real-time Notifications**: Order status updates and live alerts powered by Ably.
- **GraphQL API**: Strongly typed, efficient data fetching using Apollo Server & Client.
- **Admin Dashboard**: Manage inventory, track orders, and view customer metrics.

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS for premium aesthetics
- **API Client**: Apollo Client (GraphQL)
- **Auth Client**: Better Auth React
- **Icons**: Lucide React

### Backend (`/backend`)
- **Runtime**: Bun (Fast JavaScript/TypeScript runtime)
- **Server**: Express v5 & Apollo Server
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Better Auth
- **Payments**: Flutterwave API
- **Real-time**: Ably

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
- [Bun](https://bun.sh/)
- [Node.js](https://nodejs.org/) (for some underlying build tools)
- A [Neon Database](https://neon.tech/) URL
- API Keys for Flutterwave, Better Auth, and Ably.

### 1. Installation

Clone the repository and install dependencies in both folders:

```bash
# Install backend dependencies
cd backend
bun install

# Install frontend dependencies
cd ../frontend
bun install
```

### 2. Environment Variables

#### Backend (`/backend/.env`)
Create a `.env` file in the `backend` directory. Reference `.env.example` if available, or use this template:
```env
# Database
DATABASE_URL="postgresql://user:pass@endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@endpoint.region.aws.neon.tech/neondb?sslmode=require"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-generated-secret"
BETTER_AUTH_URL="http://localhost:4000"

# Frontend Integration
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"

# Real-time (Ably)
ABLY_API_KEY="your-ably-key"

# Payments (Flutterwave)
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-xxx"
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-xxx"
FLUTTERWAVE_SECRET_HASH="your-custom-webhook-hash"
```

#### Frontend (`/frontend/.env.local`)
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 3. Database Setup

Navigate to the `backend` directory, apply the database schema, and seed the initial data:

```bash
cd backend

# Run Prisma migrations to set up your tables
bunx prisma migrate dev

# Seed the database with sample products and images
bun run db:seed
```

### 4. Running the Application

You need two terminal windows to run both the frontend and backend servers simultaneously.

**Terminal 1: Start the Backend Server**
```bash
cd backend
bun run dev
```
*The API will be available at `http://localhost:4000/graphql`*

**Terminal 2: Start the Frontend Application**
```bash
cd frontend
bun run dev
```
*The Storefront will be available at `http://localhost:3000`*

---

## 📂 Project Structure

```
.
├── backend/                  # Express + Apollo Server
│   ├── prisma/               # Database schema and migrations
│   ├── src/
│   │   ├── graphql/          # TypeDefs and Resolvers
│   │   ├── lib/              # Auth, Payments, and Integrations
│   │   ├── index.ts          # Server entry point
│   │   └── seed.ts           # Database seeding script
│   └── package.json
│
├── frontend/                 # Next.js Application
│   ├── public/               # Static assets and seeded images
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   └── lib/              # Apollo and Auth client configurations
│   └── package.json
│
└── README.md
```

## 🤝 Contributing
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request.
