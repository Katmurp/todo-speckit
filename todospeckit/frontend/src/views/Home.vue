<script setup>
import { computed } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const user = computed(() => Utils.getStore("user"));
const firstName = computed(() => user.value?.fName || "there");

const signOut = () => authServices.logoutUser();
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-4">Welcome, {{ firstName }}</h1>
    <p class="text-body-1 mb-6">You are signed in.</p>
    <v-btn color="primary" variant="elevated" class="oc-cta" @click="signOut">
      Sign out
    </v-btn>
  </v-container>
</template>
