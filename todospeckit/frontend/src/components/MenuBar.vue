<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import { emailRules } from "../config/validation.js";

const user = ref(Utils.getStore("user"));
const loggingOut = ref(false);
const profileMenuOpen = ref(false);
const editDialogOpen = ref(false);
const editForm = ref(null);
const saveLoading = ref(false);
const dialogError = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const parts = [user.value.fName, user.value.lName].filter(Boolean);
  return parts.length ? parts.join(" ") : user.value.username ?? "";
});

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});

const fillFormFromUser = (profile) => {
  fName.value = profile?.fName ?? "";
  lName.value = profile?.lName ?? "";
  email.value = profile?.email ?? "";
  username.value = profile?.username ?? "";
};

const openEditDialog = async () => {
  profileMenuOpen.value = false;
  dialogError.value = "";
  password.value = "";
  confirmPassword.value = "";
  fillFormFromUser(user.value);
  editDialogOpen.value = true;

  if (!user.value?.userId) {
    return;
  }

  try {
    const response = await userServices.getUser(user.value.userId);
    fillFormFromUser(response.data);
  } catch {
    // keep session values
  }
};

const closeEditDialog = () => {
  editDialogOpen.value = false;
  dialogError.value = "";
  password.value = "";
  confirmPassword.value = "";
};

const handleSaveProfile = async () => {
  dialogError.value = "";
  const { valid } = await editForm.value.validate();

  if (!valid || !user.value?.userId) {
    return;
  }

  const payload = {
    fName: fName.value.trim(),
    lName: lName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
  };

  if (password.value) {
    payload.password = password.value;
  }

  saveLoading.value = true;

  try {
    const response = await userServices.updateUser(user.value.userId, payload);
    const current = Utils.getStore("user") ?? {};
    Utils.setStore("user", {
      ...current,
      userId: response.data.id,
      fName: response.data.fName,
      lName: response.data.lName,
      email: response.data.email,
      username: response.data.username,
      role: response.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    closeEditDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to update profile.";
  } finally {
    saveLoading.value = false;
  }
};

const handleLogout = async () => {
  loggingOut.value = true;
  profileMenuOpen.value = false;

  try {
    await authServices.logoutUser();
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>

    <v-spacer />

    <template v-if="user">
      <v-menu v-model="profileMenuOpen" location="bottom end">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-account-circle"
            variant="text"
            color="white"
            aria-label="Open profile menu"
            v-bind="props"
          />
        </template>
        <v-card min-width="280" rounded="lg">
          <v-list>
            <v-list-item :title="displayName">
              <v-list-item-subtitle>{{ user.username }}</v-list-item-subtitle>
              <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openEditDialog"
            >
              Edit Profile
            </v-btn>
          </v-card-actions>
          <v-list>
            <v-list-item title="Log out" :disabled="loggingOut" @click="handleLogout" />
          </v-list>
        </v-card>
      </v-menu>
    </template>
  </v-app-bar>

  <v-dialog v-if="editDialogOpen" v-model="editDialogOpen" max-width="520">
    <v-card rounded="lg">
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-form ref="editForm" @submit.prevent="handleSaveProfile">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="fName"
                label="First name"
                density="comfortable"
                :rules="fNameRules"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="lName"
                label="Last name"
                density="comfortable"
                :rules="lNameRules"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                density="comfortable"
                :rules="emailRules"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="username"
                label="Username"
                density="comfortable"
                :rules="usernameRules"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="password"
                label="New password"
                type="password"
                density="comfortable"
                :rules="passwordRules"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="confirmPassword"
                label="Confirm password"
                type="password"
                density="comfortable"
                :rules="confirmPasswordRules"
              />
            </v-col>
          </v-row>
          <v-alert v-if="dialogError" type="error" density="compact" class="mt-2">
            {{ dialogError }}
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeEditDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saveLoading"
          @click="handleSaveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
