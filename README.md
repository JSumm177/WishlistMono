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

#### Run the Full Stack (Web + Mobile Dev Server):

From the root directory, running:

```bash
pnpm dev
```

will concurrently boot up:

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Mobile Metro Bundler**: Port `8083` (to avoid clashing with RefWikiMono on `8081`)

_If you only want to run the web app, you can run:_

```bash
pnpm --filter web dev
```

#### Run the Mobile App Individually:

If you prefer to start the mobile app dev server manually on the custom port:

```bash
cd apps/mobile
pnpm start --clear
```

- **Simulator**: Press `i` for iOS or `a` for Android.
- **Physical Device**: Scan the QR code in the terminal using the Expo Go app.
- **Note**: If using a physical device, update the tRPC URL in `apps/mobile/app/_layout.tsx` to your computer's local IP address.

---

## 🧪 Manual Verification & Testing Environment

To manually verify that everything functions correctly across the entire stack, follow these steps to spin up the Web, iOS, and Android environments concurrently:

### 1. Fire up the Core Development Servers

From the root of the project, start all local development environments:

```bash
pnpm dev
```

This boots up the **Next.js Web App / tRPC API Server** on [http://localhost:3000](http://localhost:3000) and the **Expo Metro Bundler** on port `8083`.

### 2. Launch the Web Environment

1. Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.
2. Sign in or register an account.
3. Verify adding, editing, and deleting vehicles. Confirm that the Make/Model dropdown options adapt dynamically when changing the modelyear.

### 3. Launch the iOS Test Environment (Simulator)

1. Ensure Xcode is installed.
2. In the terminal window running the Expo Metro Bundler, press **`i`** to trigger the iOS simulator, or run directly:
   ```bash
   pnpm --filter mobile ios
   ```
3. The simulator will boot up, install the Expo client, and open the Mobile app.
4. Sign in using the same credentials as Web and check list synchronization.

### 4. Launch the Android Test Environment (Emulator)

1. Ensure Android Studio is installed and an AVD (Android Virtual Device) is running.
2. In the Expo Metro Bundler terminal window, press **`a`** to load the app in the Android emulator, or run directly:
   ```bash
   pnpm --filter mobile android
   ```
3. Sign in to confirm database syncing.

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
