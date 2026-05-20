import { generateReactNativeHelpers } from "@uploadthing/expo";
import type { OurFileRouter } from "../../web/app/api/uploadthing/core";

import { Platform } from "react-native";

const rawUrl = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";
const serverUrl = Platform.OS === "android" ? rawUrl.replace("localhost", "10.0.2.2") : rawUrl;

export const { useImageUploader } = generateReactNativeHelpers<OurFileRouter>({
  url: serverUrl,
});
