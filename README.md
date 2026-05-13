# WishlistMono

A full-stack, type-safe vehicle wishlist monorepo built with modern "DX-first" tools. This project bridges the gap between web and mobile using a shared data layer and type-safe API.

---

## 🏗 Stack Architecture

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| **Monorepo**   | Turborepo + pnpm Workspaces                       |
| **Web**        | Next.js 15 (App Router)                           |
| **Mobile**     | Expo SDK 51 (React Native)                        |
| **API**        | tRPC (Type-safe communication)                    |
| **Database**   | Drizzle ORM + SQLite (local) / Turso (production) |
| **Validation** | Zod (Shared schemas)                              |
| **Auth**       | Clerk (Unified web/mobile identity)               |

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)
- [Expo Go](https://expo.dev/go) (for physical device testing)

### 2. Installation

Install all dependencies from the root:

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in `apps/web/` and a `.env` file in `apps/mobile/` with your Clerk and UploadThing credentials:

**`apps/web/.env.local`**

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# UploadThing
UPLOADTHING_TOKEN=...
```

**`apps/mobile/.env`**

```bash
# Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# UploadThing (Set to your local IP for physical device testing)
EXPO_PUBLIC_SERVER_URL=http://localhost:3000
```

### 4. Database Initialization

Initialize your local SQLite database and sync the schema:

```bash
pnpm --filter @wishlist/db db:push
```

### 5. Running the Development Environment

#### Run everything (Web + API + DB):

```bash
pnpm dev
```

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **DB Studio**: `pnpm --filter @wishlist/db db:studio` (GUI to view data)

#### Run Mobile App:

```bash
cd apps/mobile
npx expo start --clear
```

- **Simulator**: Press `i` for iOS or `a` for Android.
- **Physical Device**: Scan the QR code in the terminal using the Expo Go app.
- **Note**: If using a physical device, update the tRPC URL in `apps/mobile/app/_layout.tsx` to your computer's local IP address.

---

## 📦 Project Structure

- `apps/web`: Next.js 15 dashboard with vehicle CRUD and Clerk integration.
- `apps/mobile`: Expo application sharing API and types.
- `packages/api`: tRPC router and shared Zod validation schemas.
- `packages/db`: Drizzle ORM configuration and database schema.

---

## 🛠 Key Features Implemented

- [x] **Type-Safe CRUD**: Adding, Editing, and Deleting vehicles updates both Web and Mobile.
- [x] **Universal Validation**: One Zod schema rules both the Web form and the API.
- [x] **Secure Auth**: Clerk middleware protection on both platforms.
- [x] **Currency Handling**: Intelligent Dollar-to-Cent conversion between UI and Database.
