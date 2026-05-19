import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertVehicleSchema,
  type InsertVehicle,
} from "@wishlist/api/src/schemas/vehicle";
import { trpc } from "../utils/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useImageUploader } from "../utils/uploadthing";
import { Alert } from "react-native";

export default function AddVehicle() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [image, setImage] = useState<string | null>(null);

  const { openImagePicker, isUploading } = useImageUploader("vehicleImage", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) {
        setImage(url);
        setValue("imageUrl", url);
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      imageUrl: "",
    },
  });

  const addVehicle = trpc.addVehicle.useMutation({
    onSuccess: () => {
      utils.getVehicles.invalidate();
      router.back();
    },
  });

  const pickImage = async () => {
    await openImagePicker({
      source: "library",
    });
  };

  const onSubmit = (data: InsertVehicle) => {
    addVehicle.mutate(data);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={pickImage}
        disabled={isUploading}
      >
        {isUploading ? (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.imagePlaceholderText}>Uploading...</Text>
          </View>
        ) : image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.imageOverlayText}>Change Photo</Text>
            </View>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={40} color="#9ca3af" />
            <Text style={styles.imagePlaceholderText}>Add Vehicle Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Make</Text>
      <Controller
        control={control}
        name="make"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.make && styles.inputError]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="e.g. Porsche"
          />
        )}
      />
      {errors.make && (
        <Text style={styles.errorText}>{errors.make.message}</Text>
      )}

      <Text style={styles.label}>Model</Text>
      <Controller
        control={control}
        name="model"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.model && styles.inputError]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="e.g. 911 GT3"
          />
        )}
      />
      {errors.model && (
        <Text style={styles.errorText}>{errors.model.message}</Text>
      )}

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Year</Text>
          <Controller
            control={control}
            name="year"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.year && styles.inputError]}
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                value={value.toString()}
                keyboardType="numeric"
              />
            )}
          />
          {errors.year && (
            <Text style={styles.errorText}>{errors.year.message}</Text>
          )}
        </View>

        <View style={styles.flex1}>
          <Text style={styles.label}>Price (USD)</Text>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                onChangeText={(text) => onChange(parseFloat(text) || undefined)}
                value={value?.toString() || ""}
                keyboardType="numeric"
                placeholder="Optional"
              />
            )}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (addVehicle.isPending || isUploading) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={addVehicle.isPending || isUploading}
      >
        {addVehicle.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Add to Wishlist</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  imagePicker: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  imagePreviewContainer: {
    flex: 1,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imageOverlayText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 15,
  },
  flex1: {
    flex: 1,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
