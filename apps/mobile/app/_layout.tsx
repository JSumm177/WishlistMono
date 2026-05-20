import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import { Stack } from "expo-router";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../utils/cache";
import { Platform } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  console.warn(
    "Clerk Publishable Key is missing. Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment.",
  );
}

function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    const rawUrl = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";
    const serverUrl = Platform.OS === "android" ? rawUrl.replace("localhost", "10.0.2.2") : rawUrl;
    
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: `${serverUrl}/api/trpc`,
          async headers() {
            const token = await getToken();
            return {
              authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    });
  });

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
