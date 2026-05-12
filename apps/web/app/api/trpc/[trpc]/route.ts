import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@wishlist/api";
import { auth } from "@clerk/nextjs/server";

const handler = async (req: Request) => {
  const { userId } = await auth();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        userId,
      }),
  });
};

export { handler as GET, handler as POST };
