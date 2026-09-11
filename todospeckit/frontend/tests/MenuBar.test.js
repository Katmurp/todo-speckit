/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import authServices from "../src/services/authServices.js";
import userServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const storedUser = {
  userId: 1,
  username: "jdoe",
  email: "jdoe@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "worker",
  token: "test-token",
};

const profileResponse = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
  createdAt: "2026-07-02T12:00:00.000Z",
  updatedAt: "2026-07-02T12:00:00.000Z",
};

describe("Feature 4 — MenuBar profile", () => {
  const mountedWrappers = [];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Utils.setStore("user", storedUser);
    userServices.getUser.mockResolvedValue({ data: profileResponse });
    authServices.logoutUser.mockResolvedValue({});
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    document.body.innerHTML = "";
    localStorage.clear();
  });

  async function mountMenuBar() {
    const { wrapper } = await mountWithPlugins(
      {
        components: { MenuBar },
        template: "<v-app><MenuBar /></v-app>",
      },
      {
        attachTo: document.body,
      }
    );
    mountedWrappers.push(wrapper);
    await flushPromises();
    return wrapper.findComponent(MenuBar);
  }

  function pageText() {
    return document.body.textContent ?? "";
  }

  async function clickBodyButton(text) {
    const button = [...document.body.querySelectorAll("button")].find(
      (btn) => btn.textContent?.trim() === text
    );

    expect(button).toBeDefined();
    button.click();
    await flushPromises();
  }

  async function openProfileMenu(wrapper) {
    await wrapper.get('[aria-label="Open profile menu"]').trigger("click");
    await flushPromises();
  }

  function getField(wrapper, label) {
    return wrapper
      .findAllComponents({ name: "VTextField" })
      .find((field) => field.props("label") === label);
  }

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);

      expect(pageText()).toContain("Jane Doe");
      expect(pageText()).toContain("jdoe");
      expect(pageText()).toContain("jdoe@example.com");
      expect(pageText()).toContain("Edit Profile");
      expect(pageText()).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);
      await clickBodyButton("Edit Profile");

      expect(pageText()).toContain("Edit Profile");
      expect(getField(wrapper, "First name").props("modelValue")).toBe("Jane");
      expect(getField(wrapper, "Last name").props("modelValue")).toBe("Doe");
      expect(getField(wrapper, "Email").props("modelValue")).toBe("jdoe@example.com");
      expect(getField(wrapper, "Username").props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);
      await clickBodyButton("Edit Profile");

      await getField(wrapper, "First name").setValue("Janet");
      await clickBodyButton("Cancel");

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toMatchObject({ fName: "Jane", username: "jdoe" });
      expect(wrapper.findComponent({ name: "VDialog" }).exists()).toBe(false);
    });

    it("User saves profile changes", async () => {
      userServices.updateUser.mockResolvedValue({
        data: {
          ...profileResponse,
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
        },
      });

      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);
      await clickBodyButton("Edit Profile");

      await getField(wrapper, "First name").setValue("Janet");
      await getField(wrapper, "Last name").setValue("Smith");
      await getField(wrapper, "Email").setValue("janet@example.com");
      await getField(wrapper, "Username").setValue("jsmith");
      await clickBodyButton("Save");

      expect(userServices.updateUser).toHaveBeenCalledWith(1, {
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      expect(Utils.getStore("user")).toMatchObject({
        userId: 1,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
        token: "test-token",
      });

      await openProfileMenu(wrapper);
      expect(pageText()).toContain("Janet Smith");
      expect(pageText()).toContain("jsmith");
      expect(pageText()).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);
      await clickBodyButton("Edit Profile");

      await getField(wrapper, "Email").setValue("notanemail");
      await clickBodyButton("Save");

      expect(pageText()).toContain("Enter a valid email address.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);
      await clickBodyButton("Edit Profile");

      await getField(wrapper, "New password").setValue("password123");
      await getField(wrapper, "Confirm password").setValue("different");
      await clickBodyButton("Save");

      expect(pageText()).toContain("Passwords do not match.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);
      await clickBodyButton("Edit Profile");

      await getField(wrapper, "New password").setValue("short");
      await getField(wrapper, "Confirm password").setValue("short");
      await clickBodyButton("Save");

      expect(pageText()).toContain("Password must be at least 8 characters.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { status: 400, data: { message: "Username is already taken." } },
      });

      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);
      await clickBodyButton("Edit Profile");
      await clickBodyButton("Save");

      expect(pageText()).toContain("Username is already taken.");
      expect(wrapper.findComponent({ name: "VAlert" }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: "VDialog" }).exists()).toBe(true);
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);

      const logoutItem = [...document.body.querySelectorAll("*")].find(
        (el) => el.textContent?.trim() === "Log out" && el.closest(".v-list-item")
      );
      const clickTarget = logoutItem?.closest(".v-list-item") ?? logoutItem;
      expect(clickTarget).toBeDefined();
      clickTarget.click();
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const wrapper = await mountMenuBar();

      const signOutButton = [...document.body.querySelectorAll("button")].find(
        (btn) => btn.textContent?.trim() === "Sign out"
      );

      expect(signOutButton).toBeUndefined();
      expect(wrapper.text()).not.toContain("Sign out");
    });
  });
});
