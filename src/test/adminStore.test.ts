import { describe, it, expect, beforeEach } from "vitest";
import { useAdminStore } from "../stores/adminStore";

describe("adminStore", () => {
  beforeEach(() => {
    // Reset productOverrides for each test
    useAdminStore.setState({ productOverrides: {} });
  });

  it("should update product override and sync total inventory", () => {
    const { updateProductOverride } = useAdminStore.getState();
    const productId = "test-prod-1";

    updateProductOverride(productId, {
      title: "Test Product",
      price: "100.00",
      sizeInventory: { "S": 10, "M": 20 }
    });

    const product = useAdminStore.getState().productOverrides[productId];
    expect(product).toBeDefined();
    expect(product.inventory).toBe(30);
    expect(product.sizeInventory?.["S"]).toBe(10);
    expect(product.sizeInventory?.["M"]).toBe(20);
  });

  it("should decrement inventory correctly", () => {
    const { updateProductOverride, decrementInventory } = useAdminStore.getState();
    const productId = "test-prod-1";

    updateProductOverride(productId, {
      title: "Test Product",
      sizeInventory: { "S": 10, "M": 20 }
    });

    decrementInventory(productId, "S", 3);

    const product = useAdminStore.getState().productOverrides[productId];
    expect(product.sizeInventory?.["S"]).toBe(7);
    expect(product.inventory).toBe(27);

    decrementInventory(productId, "M", 25); // More than available
    const updatedProduct = useAdminStore.getState().productOverrides[productId];
    expect(updatedProduct.sizeInventory?.["M"]).toBe(0);
    expect(updatedProduct.inventory).toBe(7);
  });

  it("should handle decrement for non-existent size", () => {
    const { updateProductOverride, decrementInventory } = useAdminStore.getState();
    const productId = "test-prod-1";

    updateProductOverride(productId, {
      title: "Test Product",
      sizeInventory: { "S": 10 }
    });

    decrementInventory(productId, "L", 5);

    const product = useAdminStore.getState().productOverrides[productId];
    expect(product.sizeInventory?.["L"]).toBe(0);
    expect(product.inventory).toBe(10);
  });
});
