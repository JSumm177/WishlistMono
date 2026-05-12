import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import { Stack } from "expo-router";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../utils/cache";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  console.warn(
    "Clerk Publishable Key is missing. Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment.",
  );
}

function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // If testing on physical device, replace localhost with your computer's IP
          url: "http://localhost:3000/api/trpc",
          async headers() {
            const token = await getToken();
            return {
              authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <TRPCProvider>
          <Stack screenOptions={{ headerTitle: "Vehicle Wishlist" }} />
        </TRPCProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
