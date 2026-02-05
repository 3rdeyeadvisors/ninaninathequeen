import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore, ADMIN_EMAIL } from "../stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    // Reset the store state if possible or just clear it if it uses persist
    // Since we're using mock, we can just manipulate it
    const { logout } = useAuthStore.getState();
    logout();
  });

  it("should have resetPassword function that returns true for existing user", () => {
    const { resetPassword } = useAuthStore.getState();
    // Default admin exists
    expect(resetPassword(ADMIN_EMAIL)).toBe(true);
  });

  it("should return false for non-existing user in resetPassword", () => {
    const { resetPassword } = useAuthStore.getState();
    expect(resetPassword("nonexistent@example.com")).toBe(false);
  });

  it("should allow deleting an account", async () => {
    const { signup, deleteAccount } = useAuthStore.getState();
    const testEmail = "test-delete@example.com";

    // Create a user
    await signup("Test User", testEmail, "password123");

    // Verify user was added
    expect(useAuthStore.getState().users.find(u => u.email === testEmail)).toBeDefined();

    // Delete user
    const success = deleteAccount(testEmail);
    expect(success).toBe(true);

    // Verify user was removed
    expect(useAuthStore.getState().users.find(u => u.email === testEmail)).toBeUndefined();
  });

  it("should log out if the current user is deleted", async () => {
    const { signup, deleteAccount } = useAuthStore.getState();
    const testEmail = "test-delete-auth@example.com";

    // Sign up and log in
    await signup("Test User", testEmail, "password123");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe(testEmail);

    // Delete current user
    deleteAccount(testEmail);

    // Should be logged out
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should allow login with the default admin credentials", async () => {
    const { login } = useAuthStore.getState();
    const success = await login(ADMIN_EMAIL, "Bossqueen26!");
    expect(success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe(ADMIN_EMAIL);
  });

  it("should trim email on login", async () => {
    const { login } = useAuthStore.getState();
    const success = await login(`  ${ADMIN_EMAIL}  `, "Bossqueen26!");
    expect(success).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe(ADMIN_EMAIL);
  });

  it("should trim email on signup", async () => {
    const { signup } = useAuthStore.getState();
    const testEmail = " trim-test@example.com ";
    const success = await signup("Trim Test", testEmail, "password123");
    expect(success).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("trim-test@example.com");
  });
});
