# WishlistMono

Developing a vehicle wishlist app is a great way to bridge the gap between heavy-duty enterprise systems and the fast-moving "DX" (Developer Experience) tools currently dominating the startup and product-focused sectors.

Since you're already well-versed in established stacks like Java/Spring and AWS, these suggestions focus on **type-safe coordination**, **edge-ready performance**, and **unified mobile/web workflows**.

---

## 1. The "T3-Adjacent" Web Stack

The industry is moving away from separate frontend and backend repositories for product-focused apps, favoring "monorepo" styles that share types from the database to the UI.

* **Next.js 15 (App Router):** The current standard for React. It uses **Server Components** to fetch data on the server, reducing the JavaScript bundle sent to the client.
* **Drizzle ORM:** A lightweight, TypeScript-first ORM. Unlike older alternatives, it's non-blocking and offers "SQL-like" syntax with perfect type inference.
* **tRPC:** This allows you to call backend functions directly from your frontend with full TypeScript intellisense, eliminating the need to manually define API endpoints or fetch patterns.
* **Shadcn/ui:** Not a component library in the traditional sense, but a collection of re-usable components you "own" (copy-paste into your project). It’s built on **Tailwind CSS** and **Radix UI**.

---

## 2. Cross-Platform Mobile

For a vehicle wishlist, you likely want native features (like a camera for snapping car photos or push notifications for price drops).

* **Expo (React Native Framework):** Expo has matured significantly. With **Expo Router**, you can use file-based routing (similar to Next.js) to build for iOS, Android, and Web simultaneously.
* **Tamagui:** A style system that optimizes your CSS-in-JS for native performance. It allows you to share 100% of your styling logic between the web wishlist and the mobile app.

---

## 3. Modern Data & Real-time

Instead of managing heavy RDS instances for a side project, serverless and "local-first" databases are the current trend for high-velocity development.

* **Turso (SQLite at the Edge):** Based on libSQL, it’s incredibly fast and can be replicated globally to minimize latency.
* **Supabase:** An "Open Source Firebase" alternative. It provides a **PostgreSQL** database, Auth, and File Storage (for vehicle images) out of the box with a very clean SDK.
* **Convex:** A newer "backend-as-a-service" that replaces the database and API layer with reactive functions. If the data in the database changes, the UI updates instantly without web-sockets configuration.

---

## 4. Specialized Tooling

* **Clerk:** Currently the "gold standard" for Auth. It handles social logins, multi-factor, and user profiles with a few lines of code, saving you weeks of security boilerplate.
* **Uploadthing:** A specialized tool for handling image uploads (car photos) in Next.js or Expo without having to manually configure S3 buckets and permissions.
* **Resend:** A modern email API that uses React templates (React Email) to send beautiful transactional emails when a "dream car" is added to the wishlist.

---

### Suggested Architecture for Your Wishlist App

| Layer | Technology Recommendation |
| --- | --- |
| **Frontend** | Next.js 15 (Web) / Expo (Mobile) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | Turso (Edge SQLite) or Neon (Serverless Postgres) |
| **Authentication** | Clerk |
| **Deployment** | Vercel (Frontend/Edge) |

This stack shifts the focus from "writing boilerplate" to "shipping features," which is a refreshing change of pace if you're used to more verbose, configuration-heavy environments.

Since you're planning this across mobile and web, would you prefer to keep them in a single Monorepo (sharing code) or build them as two separate projects?
