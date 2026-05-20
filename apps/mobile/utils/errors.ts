import { isClerkAPIResponseError } from "@clerk/clerk-expo";

export function logClerkError(err: unknown, contextMessage: string) {
  if (isClerkAPIResponseError(err)) {
    const safeErrors = (err as any).errors.map((e: any) => ({
      code: e.code,
      message: e.message,
      longMessage: e.longMessage,
    }));
    console.error(contextMessage, JSON.stringify(safeErrors, null, 2));
  } else if (err instanceof Error) {
    console.error(contextMessage, err.message);
  } else {
    console.error(contextMessage, "An unknown error occurred");
  }
}
