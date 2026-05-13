import { generateReactNativeHelpers } from "@uploadthing/expo";
import type { OurFileRouter } from "../../web/app/api/uploadthing/core";

export const { useImageUploader } = generateReactNativeHelpers<OurFileRouter>({
  url: process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000",
});
