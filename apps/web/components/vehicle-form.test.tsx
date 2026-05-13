import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VehicleForm } from "./vehicle-form";

// Mock trpc
jest.mock("../utils/trpc", () => ({
  trpc: {
    useUtils: jest.fn(() => ({
      getVehicles: {
        invalidate: jest.fn(),
      },
    })),
    addVehicle: {
      useMutation: jest.fn(() => ({
        mutate: jest.fn(),
        isPending: false,
      })),
    },
    updateVehicle: {
      useMutation: jest.fn(() => ({
        mutate: jest.fn(),
        isPending: false,
      })),
    },
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    refresh: jest.fn(),
  })),
}));

// Mock uploadthing
jest.mock("../utils/uploadthing", () => ({
  UploadButton: () => <div data-testid="upload-button" />,
}));

describe("VehicleForm Validation", () => {
  it("should show validation errors when fields are empty and submitted", async () => {
    render(<VehicleForm />);

    const submitButton = screen.getByRole("button", { name: /add to wishlist/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/make is required/i)).toBeInTheDocument();
      expect(screen.getByText(/model is required/i)).toBeInTheDocument();
    });
  });

  it("should show error for invalid year", async () => {
    render(<VehicleForm />);

    const yearInput = screen.getByLabelText(/year/i);
    fireEvent.change(yearInput, { target: { value: "1899" } });

    const submitButton = screen.getByRole("button", { name: /add to wishlist/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Number must be greater than or equal to 1900/i)).toBeInTheDocument();
    });
  });
});
