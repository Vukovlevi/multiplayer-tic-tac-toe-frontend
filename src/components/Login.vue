<script setup>
import { ref } from "vue";
import axios from "axios";
import { io } from "socket.io-client";

//socket.io config
const PORT = import.meta.env.VITE_APP_PORT;
const socket = io(PORT);

//configuring the emits to the App.vue
const emits = defineEmits(["connect", "error"]);

//setting up the basic variables
const preSetUsername = localStorage.getItem("username") || null;
const codeInput = ref("");
const username = ref(preSetUsername);
if (preSetUsername != null) username.value = preSetUsername;

//handling the connect
function connect() {
  if (codeInput.value == "" || username.value == "") return; //TODO maybe throw an error to the user
  socket.emit("user-data", { username: username.value, code: codeInput.value });
  localStorage.setItem("code", codeInput.value);
  localStorage.setItem("username", username.value);
  emits("connect"); //this is a local emit to the App.vue
}

//call a game code from the server
function callCode() {
  axios.get("/generatecode").then((resp) => {
    const data = resp.data;
    const error = data.error || null;
    if (error != null) {
      alert(error);
      emits("error");
      return;
    }
    const code = data.code;
    codeInput.value = code;
  });
}
</script>

<template>
  <div class="login-form df">
    <div class="username-container df">
      <label for="username">Felhasználónév</label>
      <input
        type="text"
        id="username"
        class="username"
        placeholder="Felhasználónév"
        v-model="username"
      />
    </div>
    <div class="code-container df">
      <label for="code">Játék kódja</label>
      <input
        type="text"
        id="code"
        class="code"
        placeholder="Játék kódja"
        v-model="codeInput"
      />
      <div class="buttons df">
        <button class="code-generator btn" @click="callCode">Kód kérése</button>
        <button type="submit" class="connect btn" @click="connect">
          Csatlakozás
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-form {
  flex-direction: column;
  gap: 3rem;
  width: min(90vw, 500px);
  border: 2px solid var(--X-color);
  border-radius: 0.75rem;
  padding: 2rem 3rem;
  font-size: 2rem;
  color: #fff;
}
.username-container,
.code-container {
  flex-direction: column;
  gap: 1rem;
}
input {
  outline: none;
  border: 1px solid var(--O-color);
  border-radius: 0.5rem;
  background: var(--place-bg-color);
  padding: 0.5rem 1rem;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.75);
  transition: all 150ms ease-in-out;
}
input:hover,
input:focus {
  border-color: var(--X-color);
}
.btn {
  border: none;
  outline: none;
  background: transparent;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  border: 2px solid var(--grey);
  border-radius: 0.5rem;
  width: max(40%, 150px);
  color: var(--grey);
  cursor: pointer;
  transition: all 150ms ease-in-out;
}
.btn:hover,
.btn:focus {
  border-color: #fff;
  color: #fff;
}
.buttons {
  justify-content: space-between;
}
@media (max-width: 350px) {
  .login-form {
    padding: 1rem 1.5rem;
  }
  .buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
