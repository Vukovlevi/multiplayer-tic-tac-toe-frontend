<script setup>
import Gamefield from "./components/Gamefield.vue";
import Login from "./components/Login.vue";
import WinLose from "./components/WinLose.vue";
import { ref } from "vue";
import { io } from "socket.io-client";
import { useRoomDataStore } from "../stores/preRoomData";
import { useWinLoseStore } from "../stores/winLose";
import exitGame from "./utilities/exit";

//socket.io config
const PORT = import.meta.env.VITE_APP_PORT;
const socket = io(PORT);

//stores and utilities setup
const ROOM_DATA = useRoomDataStore();
const winLose = useWinLoseStore();

//check if a room is already defined and display login/gamefield based on that
const code = localStorage.getItem("code") || null;
let login = code == null ? true : false;

//configuring the room and the connecting variables
const username = localStorage.getItem("username");
const room = localStorage.getItem("code");
if (username == null && room != null) backToLogin();
if (username != null && room != null)
  socket.emit("check-room", { username: username, room: room });
const isGameOver = ref();
const preIsGameOver = sessionStorage.getItem("isGameOver") || false;
isGameOver.value = preIsGameOver;

//socket event handlers
socket.on("no-room", () => {
  exitGame(socket, null);
  alert("A szoba nem létezik!");
  backToLogin();
});
socket.on("full-room", () => {
  alert("A szoba tele van, nem tudsz hozzá csatlakozni!");
  backToLogin();
});
socket.on("room-data", (room) => {
  ROOM_DATA.roomData = room;
});
socket.on("deleted", () => {
  alert("A másik játékos kilépett és a szoba törölve lett!");
  exitGame(socket, null);
  document.location.reload();
});

//login fucntions
function updateLogin() {
  login = login == true ? false : true;
  document.location.reload();
}

function backToLogin() {
  login = true;
  document.location.reload();
}

//handleing the win/lose states
winLose.$subscribe(() => {
  isGameOver.value = true;
  sessionStorage.setItem("isGameOver", isGameOver.value);
});

function nextRound() {
  isGameOver.value = false;
  sessionStorage.removeItem("isGameOver");
  document.location.reload();
}
</script>

<template>
  <Login v-if="login" @connect="updateLogin" @error="backToLogin" />
  <Gamefield v-else />
  <WinLose class="win-lose" v-show="isGameOver" @nextRound="nextRound" />
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Quicksand&display=swap");
:root {
  --bg-color: #1a2b32;
  --place-bg-color: #1f3540;
  --place-width: 8vw;
  --X-color: #30c4be;
  --O-color: #f2b238;
  --grey: #a8bec9;
}
*,
*::after,
*::before {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
html,
body {
  width: 100%;
  height: 100%;
  font-family: "Quicksand", sans-serif;
}
body {
  background-color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  position: relative;
}
.df {
  display: flex;
  gap: 1rem;
}
.rounded {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.win-lose {
  position: absolute;
  left: 0;
  top: 50%;
  translate: 0% -50%;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
