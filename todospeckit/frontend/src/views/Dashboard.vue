<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";
import {
  formatDueDate,
  isTodoOverdue,
  optionalDueDateRules,
  toDateInputValue,
} from "../config/validation.js";

const lists = ref([]);
const listsLoading = ref(false);
const listsError = ref("");

const createDialogOpen = ref(false);
const renameDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const itemsDialogOpen = ref(false);
const addTodoDialogOpen = ref(false);
const editTodoDialogOpen = ref(false);
const deleteTodoDialogOpen = ref(false);

const createForm = ref(null);
const renameForm = ref(null);
const addTodoForm = ref(null);
const editTodoForm = ref(null);

const newListName = ref("");
const renameListName = ref("");
const listToRename = ref(null);
const listToDelete = ref(null);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todosError = ref("");
const todoToEdit = ref(null);
const todoToDelete = ref(null);
const newTodoTitle = ref("");
const newTodoDueDate = ref("");
const editTodoTitle = ref("");
const editTodoDueDate = ref("");

const createLoading = ref(false);
const renameLoading = ref(false);
const deleteLoading = ref(false);
const addTodoLoading = ref(false);
const editTodoLoading = ref(false);
const deleteTodoLoading = ref(false);
const dialogError = ref("");
const todoDialogError = ref("");

const listNameRules = [
  (value) => !!value?.trim() || "List name is required.",
  (value) => !value || value.trim().length <= 100 || "List name must be 100 characters or fewer.",
];

const todoTitleRules = [
  (value) => !!value?.trim() || "Todo title is required.",
  (value) => !value || value.trim().length <= 255 || "Todo title must be 255 characters or fewer.",
];

const sortTodos = (items) =>
  [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

const loadLists = async () => {
  listsLoading.value = true;
  listsError.value = "";

  try {
    const response = await listServices.getLists();
    lists.value = response.data;
  } catch (error) {
    listsError.value = error.response?.data?.message || "Failed to load lists.";
  } finally {
    listsLoading.value = false;
  }
};

const openCreateDialog = () => {
  dialogError.value = "";
  newListName.value = "";
  createDialogOpen.value = true;
};

const closeCreateDialog = () => {
  createDialogOpen.value = false;
  newListName.value = "";
  dialogError.value = "";
};

const handleCreateList = async () => {
  dialogError.value = "";
  const { valid } = await createForm.value.validate();

  if (!valid) {
    return;
  }

  createLoading.value = true;

  try {
    const response = await listServices.createList(newListName.value.trim());
    lists.value = [...lists.value, response.data].sort((a, b) => a.name.localeCompare(b.name));
    closeCreateDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to create list.";
  } finally {
    createLoading.value = false;
  }
};

const openRenameDialog = (list) => {
  dialogError.value = "";
  listToRename.value = list;
  renameListName.value = list.name;
  renameDialogOpen.value = true;
};

const closeRenameDialog = () => {
  renameDialogOpen.value = false;
  listToRename.value = null;
  renameListName.value = "";
  dialogError.value = "";
};

const handleRenameList = async () => {
  dialogError.value = "";
  const { valid } = await renameForm.value.validate();

  if (!valid || !listToRename.value) {
    return;
  }

  renameLoading.value = true;

  try {
    const response = await listServices.updateList(
      listToRename.value.id,
      renameListName.value.trim()
    );
    lists.value = lists.value
      .map((list) => (list.id === response.data.id ? response.data : list))
      .sort((a, b) => a.name.localeCompare(b.name));
    closeRenameDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to rename list.";
  } finally {
    renameLoading.value = false;
  }
};

const openDeleteDialog = (list) => {
  listToDelete.value = list;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  listToDelete.value = null;
};

const handleDeleteList = async () => {
  if (!listToDelete.value) {
    return;
  }

  deleteLoading.value = true;

  try {
    await listServices.deleteList(listToDelete.value.id);
    lists.value = lists.value.filter((list) => list.id !== listToDelete.value.id);

    if (itemsList.value?.id === listToDelete.value.id) {
      closeItemsDialog();
    }

    closeDeleteDialog();
  } catch (error) {
    listsError.value = error.response?.data?.message || "Failed to delete list.";
    closeDeleteDialog();
  } finally {
    deleteLoading.value = false;
  }
};

const loadTodos = async () => {
  if (!itemsList.value) {
    todos.value = [];
    return;
  }

  todosLoading.value = true;
  todosError.value = "";

  try {
    const response = await todoServices.getTodos(itemsList.value.id);
    todos.value = sortTodos(response.data);
  } catch (error) {
    todos.value = [];
    todosError.value = error.response?.data?.message || "Failed to load todos.";
  } finally {
    todosLoading.value = false;
  }
};

const openItemsDialog = async (list) => {
  itemsList.value = list;
  itemsDialogOpen.value = true;
  await loadTodos();
};

const closeItemsDialog = () => {
  itemsDialogOpen.value = false;
  itemsList.value = null;
  todos.value = [];
  todosError.value = "";
  closeAddTodoDialog();
  closeEditTodoDialog();
  closeDeleteTodoDialog();
};

const openAddTodoDialog = () => {
  todoDialogError.value = "";
  newTodoTitle.value = "";
  newTodoDueDate.value = "";
  addTodoDialogOpen.value = true;
};

const closeAddTodoDialog = () => {
  addTodoDialogOpen.value = false;
  newTodoTitle.value = "";
  newTodoDueDate.value = "";
  todoDialogError.value = "";
};

const handleCreateTodo = async () => {
  todoDialogError.value = "";
  const { valid } = await addTodoForm.value.validate();

  if (!valid || !itemsList.value) {
    return;
  }

  addTodoLoading.value = true;

  try {
    const dueDate = newTodoDueDate.value || undefined;
    const response = dueDate
      ? await todoServices.createTodo(itemsList.value.id, newTodoTitle.value.trim(), dueDate)
      : await todoServices.createTodo(itemsList.value.id, newTodoTitle.value.trim());
    todos.value = sortTodos([...todos.value, response.data]);
    closeAddTodoDialog();
  } catch (error) {
    todoDialogError.value = error.response?.data?.message || "Failed to add todo.";
  } finally {
    addTodoLoading.value = false;
  }
};

const handleToggleTodo = async (todo, completed) => {
  try {
    const response = await todoServices.updateTodo(todo.id, { completed });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to update todo.";
  }
};

const openEditTodoDialog = (todo) => {
  todoDialogError.value = "";
  todoToEdit.value = todo;
  editTodoTitle.value = todo.title;
  editTodoDueDate.value = toDateInputValue(todo.dueDate);
  editTodoDialogOpen.value = true;
};

const closeEditTodoDialog = () => {
  editTodoDialogOpen.value = false;
  todoToEdit.value = null;
  editTodoTitle.value = "";
  editTodoDueDate.value = "";
  todoDialogError.value = "";
};

const handleEditTodo = async () => {
  todoDialogError.value = "";
  const { valid } = await editTodoForm.value.validate();

  if (!valid || !todoToEdit.value) {
    return;
  }

  editTodoLoading.value = true;

  try {
    const response = await todoServices.updateTodo(todoToEdit.value.id, {
      title: editTodoTitle.value.trim(),
      dueDate: editTodoDueDate.value || null,
    });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
    closeEditTodoDialog();
  } catch (error) {
    todoDialogError.value = error.response?.data?.message || "Failed to update todo.";
  } finally {
    editTodoLoading.value = false;
  }
};

const openDeleteTodoDialog = (todo) => {
  todoToDelete.value = todo;
  deleteTodoDialogOpen.value = true;
};

const closeDeleteTodoDialog = () => {
  deleteTodoDialogOpen.value = false;
  todoToDelete.value = null;
};

const handleDeleteTodo = async () => {
  if (!todoToDelete.value) {
    return;
  }

  deleteTodoLoading.value = true;

  try {
    await todoServices.deleteTodo(todoToDelete.value.id);
    todos.value = todos.value.filter((item) => item.id !== todoToDelete.value.id);
    closeDeleteTodoDialog();
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to delete todo.";
    closeDeleteTodoDialog();
  } finally {
    deleteTodoLoading.value = false;
  }
};

onMounted(() => {
  loadLists();
});
</script>

<template>
  <v-container class="py-6">
    <v-card-item class="px-0 mb-4">
      <template #title>
        <h1 class="text-h4">My Lists</h1>
      </template>
      <template #append>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          @click="openCreateDialog"
        >
          + New List
        </v-btn>
      </template>
    </v-card-item>

    <v-progress-linear v-if="listsLoading" indeterminate class="mb-4" />

    <v-alert v-if="listsError" type="error" class="mb-4">
      {{ listsError }}
    </v-alert>

    <p v-if="!listsLoading && lists.length === 0" class="text-body-1">
      No lists yet. Create your first list.
    </p>

    <v-list v-else-if="!listsLoading" rounded="lg">
      <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
        <template #append>
          <v-btn
            icon="mdi-format-list-checks"
            size="small"
            variant="text"
            :aria-label="`View items for ${list.name}`"
            @click="openItemsDialog(list)"
          />
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            aria-label="Edit list"
            @click="openRenameDialog(list)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            aria-label="Delete list"
            @click="openDeleteDialog(list)"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="createDialogOpen" max-width="480">
      <v-card>
        <v-card-title>New list</v-card-title>
        <v-card-text>
          <v-form ref="createForm" @submit.prevent="handleCreateList">
            <v-text-field
              v-model="newListName"
              label="List name"
              density="comfortable"
              :rules="listNameRules"
            />
            <v-alert v-if="dialogError" type="error" class="mt-2">
              {{ dialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeCreateDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="createLoading"
            @click="handleCreateList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Rename list</v-card-title>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="handleRenameList">
            <v-text-field
              v-model="renameListName"
              label="List name"
              density="comfortable"
              :rules="listNameRules"
            />
            <v-alert v-if="dialogError" type="error" class="mt-2">
              {{ dialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeRenameDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="renameLoading"
            @click="handleRenameList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete list</v-card-title>
        <v-card-text>
          Delete “{{ listToDelete?.name }}”? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleteLoading"
            @click="handleDeleteList"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="itemsDialogOpen" v-model="itemsDialogOpen" max-width="640">
      <v-card>
        <v-card-title>{{ itemsList?.name }} — Items</v-card-title>
        <v-card-text>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta mb-4"
            @click="openAddTodoDialog"
          >
            + Add Item
          </v-btn>

          <v-progress-linear v-if="todosLoading" indeterminate class="mb-4" />

          <v-alert v-if="todosError" type="error" class="mb-4">
            {{ todosError }}
          </v-alert>

          <p v-if="!todosLoading && todos.length === 0" class="text-body-1">
            No todos in this list yet.
          </p>

          <v-list v-else-if="!todosLoading">
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  @update:model-value="(value) => handleToggleTodo(todo, value)"
                />
              </template>
              <v-list-item-title :class="todo.completed ? 'text-decoration-line-through text-medium-emphasis' : ''">
                {{ todo.title }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="todo.dueDate">
                <span
                  data-testid="todo-due-date"
                  :class="isTodoOverdue(todo) ? 'text-error' : 'text-medium-emphasis'"
                >
                  {{ formatDueDate(todo.dueDate) }}
                </span>
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit todo"
                  @click="openEditTodoDialog(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete todo"
                  @click="openDeleteTodoDialog(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItemsDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="addTodoDialogOpen" v-model="addTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Add item</v-card-title>
        <v-card-text>
          <v-form ref="addTodoForm" @submit.prevent="handleCreateTodo">
            <v-text-field
              v-model="newTodoTitle"
              label="Todo title"
              density="comfortable"
              :rules="todoTitleRules"
            />
            <v-text-field
              v-model="newTodoDueDate"
              label="Due date"
              type="date"
              density="comfortable"
              :rules="optionalDueDateRules"
            />
            <v-alert v-if="todoDialogError" type="error" class="mt-2">
              {{ todoDialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeAddTodoDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="addTodoLoading"
            @click="handleCreateTodo"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="editTodoDialogOpen" v-model="editTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Edit item</v-card-title>
        <v-card-text>
          <v-form ref="editTodoForm" @submit.prevent="handleEditTodo">
            <v-text-field
              v-model="editTodoTitle"
              label="Todo title"
              density="comfortable"
              :rules="todoTitleRules"
            />
            <v-text-field
              v-model="editTodoDueDate"
              label="Due date"
              type="date"
              density="comfortable"
              :rules="optionalDueDateRules"
            />
            <v-alert v-if="todoDialogError" type="error" class="mt-2">
              {{ todoDialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeEditTodoDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="editTodoLoading"
            @click="handleEditTodo"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="deleteTodoDialogOpen" v-model="deleteTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete item</v-card-title>
        <v-card-text>
          Delete “{{ todoToDelete?.title }}”?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeDeleteTodoDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleteTodoLoading"
            @click="handleDeleteTodo"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
