import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertVehicleSchema, type InsertVehicle } from '@wishlist/api/src/schemas/vehicle';
import { trpc } from '../utils/trpc';
import { useRouter } from 'expo-router';

export default function AddVehicle() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { control, handleSubmit, formState: { errors } } = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      year: new Date().getFullYear(),
    }
  });

  const addVehicle = trpc.addVehicle.useMutation({
    onSuccess: () => {
      utils.getVehicles.invalidate();
      router.back();
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    addVehicle.mutate(data);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
      {errors.make && <Text style={styles.errorText}>{errors.make.message}</Text>}

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
      {errors.model && <Text style={styles.errorText}>{errors.model.message}</Text>}

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
          {errors.year && <Text style={styles.errorText}>{errors.year.message}</Text>}
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
                value={value?.toString() || ''}
                keyboardType="numeric"
                placeholder="Optional"
              />
            )}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, addVehicle.isPending && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={addVehicle.isPending}
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  flex1: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
