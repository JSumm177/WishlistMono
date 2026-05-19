import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VehicleForm } from "./vehicle-form";
import { trpc } from "../utils/trpc";

const mockAddMutate = jest.fn();
const mockUpdateMutate = jest.fn();
const mockInvalidate = jest.fn();
const mockRefresh = jest.fn();

// Mock trpc
jest.mock("../utils/trpc", () => ({
  trpc: {
    useUtils: jest.fn(() => ({
      getVehicles: {
        invalidate: mockInvalidate,
      },
    })),
    addVehicle: {
      useMutation: jest.fn((opts) => ({
        mutate: (data: any) => {
          mockAddMutate(data);
          opts?.onSuccess?.();
        },
        isPending: false,
      })),
    },
    updateVehicle: {
      useMutation: jest.fn((opts) => ({
        mutate: (data: any) => {
          mockUpdateMutate(data);
          opts?.onSuccess?.();
        },
        isPending: false,
      })),
    },
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    refresh: mockRefresh,
  })),
}));

// Mock uploadthing
jest.mock("../utils/uploadthing", () => ({
  UploadButton: ({ onClientUploadComplete }: any) => (
    <button
      data-testid="upload-button"
      onClick={() =>
        onClientUploadComplete([{ url: "https://example.com/image.jpg" }])
      }
    >
      Upload
    </button>
  ),
}));

describe("VehicleForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Validation", () => {
    it("should show validation errors when fields are empty and submitted", async () => {
      render(<VehicleForm />);

      const submitButton = screen.getByRole("button", {
        name: /add to wishlist/i,
      });
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

      const submitButton = screen.getByRole("button", {
        name: /add to wishlist/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Number must be greater than or equal to 1900/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Upload", () => {
    it("should update image preview when upload is complete", async () => {
      render(<VehicleForm />);

      const uploadButton = screen.getByTestId("upload-button");
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByAltText(/vehicle preview/i)).toBeInTheDocument();
        const src = screen.getByAltText(/vehicle preview/i).getAttribute("src");
        expect(decodeURIComponent(src || "")).toContain(
          "example.com/image.jpg",
        );
      });
    });

    it("should remove image preview when remove button is clicked", async () => {
      render(<VehicleForm />);

      // First upload
      fireEvent.click(screen.getByTestId("upload-button"));

      await waitFor(() => {
        expect(screen.getByAltText(/vehicle preview/i)).toBeInTheDocument();
      });

      // Then remove
      const removeButton = screen.getByRole("button", { name: /remove/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(
          screen.queryByAltText(/vehicle preview/i),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/upload vehicle photo/i)).toBeInTheDocument();
      });
    });
  });

  describe("Submission", () => {
    it("should call addVehicle.mutate when creating a new vehicle", async () => {
      const onSuccess = jest.fn();
      render(<VehicleForm onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/make/i), {
        target: { value: "Ford" },
      });
      fireEvent.change(screen.getByLabelText(/model/i), {
        target: { value: "Mustang" },
      });
      fireEvent.change(screen.getByLabelText(/year/i), {
        target: { value: "2024" },
      });
      fireEvent.change(screen.getByLabelText(/price/i), {
        target: { value: "45000" },
      });

      const submitButton = screen.getByRole("button", {
        name: /add to wishlist/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            make: "Ford",
            model: "Mustang",
            year: 2024,
            price: 45000,
          }),
        );
      });

      expect(onSuccess).toHaveBeenCalled();
      expect(mockInvalidate).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("should call updateVehicle.mutate when editing an existing vehicle", async () => {
      const initialData = {
        id: 1,
        make: "Porsche",
        model: "911",
        year: 2023,
        price: 120000,
      };
      const onSuccess = jest.fn();
      render(<VehicleForm initialData={initialData} onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/model/i), {
        target: { value: "911 GT3" },
      });

      const submitButton = screen.getByRole("button", {
        name: /update vehicle/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            make: "Porsche",
            model: "911 GT3",
            year: 2023,
            price: 120000,
          }),
        );
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it("should show loading state while submitting", () => {
      (trpc.addVehicle.useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
      });

      render(<VehicleForm />);
      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /saving\.\.\./i }),
      ).toBeDisabled();
    });
  });
});
