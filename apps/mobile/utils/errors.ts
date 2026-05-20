import { isClerkAPIResponseError } from "@clerk/clerk-expo";

export function logClerkError(err: unknown, contextMessage: string) {
  if (isClerkAPIResponseError(err)) {
    console.error(contextMessage, JSON.stringify((err as any).errors, null, 2));
  } else {
    console.error(contextMessage, err);
  }
}
