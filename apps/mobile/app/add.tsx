import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  FlatList,
  Alert,
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

const POPULAR_MAKES = [
  "Acura",
  "Alfa Romeo",
  "Alpine",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Bugatti",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Lotus",
  "Lucid",
  "Maserati",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "MINI",
  "Mitsubishi",
  "Nissan",
  "Polestar",
  "Pontiac",
  "Porsche",
  "Ram",
  "Rivian",
  "Rolls-Royce",
  "Saab",
  "Saturn",
  "Scion",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

const startYear = 1940;
const currentYear = new Date().getFullYear();
const YEARS = Array.from(
  { length: currentYear + 2 - startYear },
  (_, i) => currentYear + 1 - i,
);

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: (string | number)[];
  selectedValue: string | number;
  onSelect: (value: any) => void;
}

function PickerModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: PickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  item === selectedValue && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    item === selectedValue && styles.modalOptionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {item === selectedValue && (
                  <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                )}
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function AddVehicle() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [image, setImage] = useState<string | null>(null);

  // Modal visibility states
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [makePickerVisible, setMakePickerVisible] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);

  // Custom fallback text toggles
  const [customMake, setCustomMake] = useState(false);
  const [customModel, setCustomModel] = useState(false);

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
    watch,
    formState: { errors },
  } = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      make: "",
      model: "",
      trim: "",
      imageUrl: "",
    },
  });

  const watchYear = watch("year");
  const watchMake = watch("make");
  const watchModel = watch("model");

  const addVehicle = trpc.addVehicle.useMutation({
    onSuccess: () => {
      utils.getVehicles.invalidate();
      router.back();
    },
  });

  // Fetch models dynamically based on selected Year & Make from back-end (NHTSA API proxy)
  const { data: nhtsaModelsData = [], isLoading: isLoadingModels } =
    trpc.getModelsForMake.useQuery(
      { make: watchMake, year: watchYear },
      {
        enabled:
          !!watchMake &&
          watchMake !== "Other" &&
          !customMake &&
          !isNaN(watchYear),
      },
    );
  const nhtsaModels = nhtsaModelsData as string[];

  const pickImage = async () => {
    await openImagePicker({
      source: "library",
    });
  };

  const onSubmit = (data: InsertVehicle) => {
    addVehicle.mutate(data);
  };

  const handleSelectYear = (y: number) => {
    setValue("year", y);
    if (!customMake) {
      setValue("model", ""); // Clear model when year changes
    }
  };

  const handleSelectMake = (make: string) => {
    if (make === "Other") {
      setCustomMake(true);
      setValue("make", "");
      setCustomModel(true);
      setValue("model", "");
    } else {
      setCustomMake(false);
      setValue("make", make);
      setCustomModel(false);
      setValue("model", "");
    }
  };

  const handleSelectModel = (model: string) => {
    if (model === "Other") {
      setCustomModel(true);
      setValue("model", "");
    } else {
      setCustomModel(false);
      setValue("model", model);
    }
  };

  const modelOptions = [...nhtsaModels, "Other"];

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

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Year</Text>
          <TouchableOpacity
            style={styles.selectTrigger}
            onPress={() => setYearPickerVisible(true)}
          >
            <Text style={styles.selectTriggerText}>{watchYear}</Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
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
                placeholder="Optional Price"
                placeholderTextColor="#9ca3af"
              />
            )}
          />
        </View>
      </View>

      <Text style={styles.label}>Make</Text>
      {!customMake ? (
        <TouchableOpacity
          style={[
            styles.selectTrigger,
            errors.make && styles.selectTriggerError,
          ]}
          onPress={() => setMakePickerVisible(true)}
        >
          <Text
            style={
              watchMake
                ? styles.selectTriggerText
                : styles.selectTriggerPlaceholder
            }
          >
            {watchMake || "Select Make"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="make"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithButton,
                  errors.make && styles.inputError,
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Type in Make..."
                placeholderTextColor="#9ca3af"
              />
            )}
          />
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={() => {
              setCustomMake(false);
              setValue("make", "");
              setCustomModel(false);
              setValue("model", "");
            }}
          >
            <Text style={styles.inlineButtonText}>List</Text>
          </TouchableOpacity>
        </View>
      )}
      {errors.make && (
        <Text style={styles.errorText}>{errors.make.message}</Text>
      )}

      <Text style={styles.label}>Model</Text>
      {!customModel && !customMake ? (
        <TouchableOpacity
          style={[
            styles.selectTrigger,
            (!watchMake || isLoadingModels) && styles.selectTriggerDisabled,
            errors.model && styles.selectTriggerError,
          ]}
          onPress={() => setModelPickerVisible(true)}
          disabled={!watchMake || isLoadingModels}
        >
          <Text
            style={
              watchModel
                ? styles.selectTriggerText
                : styles.selectTriggerPlaceholder
            }
          >
            {isLoadingModels
              ? "Loading models..."
              : !watchMake
                ? "Select Make first"
                : watchModel || "Select Model"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="model"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithButton,
                  errors.model && styles.inputError,
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Type in Model..."
                placeholderTextColor="#9ca3af"
              />
            )}
          />
          {!customMake && (
            <TouchableOpacity
              style={styles.inlineButton}
              onPress={() => {
                setCustomModel(false);
                setValue("model", "");
              }}
            >
              <Text style={styles.inlineButtonText}>List</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {errors.model && (
        <Text style={styles.errorText}>{errors.model.message}</Text>
      )}

      <Text style={styles.label}>Trim (Optional)</Text>
      <Controller
        control={control}
        name="trim"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder="e.g. GT3, Lariat, Type R"
            placeholderTextColor="#9ca3af"
          />
        )}
      />

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

      {/* Picker Modals for Bottom Sheet experience */}
      <PickerModal
        visible={yearPickerVisible}
        onClose={() => setYearPickerVisible(false)}
        title="Select Year"
        options={YEARS}
        selectedValue={watchYear}
        onSelect={handleSelectYear}
      />

      <PickerModal
        visible={makePickerVisible}
        onClose={() => setMakePickerVisible(false)}
        title="Select Make"
        options={[...POPULAR_MAKES, "Other"]}
        selectedValue={watchMake}
        onSelect={handleSelectMake}
      />

      <PickerModal
        visible={modelPickerVisible}
        onClose={() => setModelPickerVisible(false)}
        title="Select Model"
        options={modelOptions}
        selectedValue={watchModel}
        onSelect={handleSelectModel}
      />
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
    paddingBottom: 40,
  },
  imagePicker: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
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
    fontWeight: "500",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imageOverlayText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
    color: "#1f2937",
  },
  inputContainer: {
    flexDirection: "row",
    position: "relative",
    width: "100%",
  },
  inputWithButton: {
    flex: 1,
    paddingRight: 65,
  },
  inlineButton: {
    position: "absolute",
    right: 12,
    top: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
  },
  inlineButtonText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
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
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Custom Select Trigger Styles
  selectTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    marginBottom: 16,
    height: 48,
  },
  selectTriggerError: {
    borderColor: "#ef4444",
  },
  selectTriggerDisabled: {
    opacity: 0.5,
    backgroundColor: "#f3f4f6",
  },
  selectTriggerText: {
    fontSize: 16,
    color: "#1f2937",
  },
  selectTriggerPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  // Modal Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalOptionSelected: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderColor: "#bfdbfe",
    borderWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#4b5563",
  },
  modalOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "700",
  },
});
