import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    // Reset the store state if possible or just clear it if it uses persist
    // Since we're using mock, we can just manipulate it
    const { logout } = useAuthStore.getState();
    logout();
  });

  it("should have resetPassword function that returns true for existing user", () => {
    const { resetPassword } = useAuthStore.getState();
    // Default admin exists: lydia@ninaarmend.co.site
    expect(resetPassword("lydia@ninaarmend.co.site")).toBe(true);
  });

  it("should return false for non-existing user in resetPassword", () => {
    const { resetPassword } = useAuthStore.getState();
    expect(resetPassword("nonexistent@example.com")).toBe(false);
  });

  it("should allow deleting an account", () => {
    const { signup, deleteAccount, users } = useAuthStore.getState();
    const testEmail = "test-delete@example.com";

    // Create a user
    signup("Test User", testEmail, "password123");

    // Verify user was added
    expect(useAuthStore.getState().users.find(u => u.email === testEmail)).toBeDefined();

    // Delete user
    const success = deleteAccount(testEmail);
    expect(success).toBe(true);

    // Verify user was removed
    expect(useAuthStore.getState().users.find(u => u.email === testEmail)).toBeUndefined();
  });

  it("should log out if the current user is deleted", () => {
    const { signup, deleteAccount } = useAuthStore.getState();
    const testEmail = "test-delete-auth@example.com";

    // Sign up and log in
    signup("Test User", testEmail, "password123");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe(testEmail);

    // Delete current user
    deleteAccount(testEmail);

    // Should be logged out
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
