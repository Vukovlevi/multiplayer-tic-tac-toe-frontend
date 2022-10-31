<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";
import { useRoomDataStore } from "../../stores/preRoomData";
import { useWinLoseStore } from "../../stores/winLose";
import { useWinnerStore } from "../../stores/winner";
import exitGame from "../utilities/exit";

//socket.io config
const PORT = import.meta.env.VITE_APP_PORT || "http://localhost:3000";
const socket = io(PORT);

//stores and utilities setup
const ROOM_DATA = useRoomDataStore();
const winLose = useWinLoseStore();
const winnerStore = useWinnerStore();
const exit = () => exitGame(socket, room);

//setting up the basic variables
const username = localStorage.getItem("username");
const room = localStorage.getItem("code");
socket.emit("click", { preConnect: true, room: room });
let canClick = true;
const winCount = sessionStorage.getItem("wins") || 0;
const tieCount = sessionStorage.getItem("ties") || 0;
const loseCount = sessionStorage.getItem("losses") || 0;
let wins = ref(winCount);
let losses = ref(loseCount);
let ties = ref(tieCount);
let thisPlayer = null; // determined later
let thisPlayerCells = [];
let opponentPlayerCells = [];

const winningSchemas = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

//handling all data coming from the server when you are in a room and request the data
ROOM_DATA.$subscribe(() => {
  const roomData = ROOM_DATA.roomData;
  if (roomData == {}) return;
  let opponentPlayer = "";
  const user = username == roomData.user1name ? "user1" : "user2"; //figuring out what user is this client
  if (roomData.user1symbol == "" || roomData.user2symbol == "") return; //if no user is set, then return
  //configuring the client variables for display and logic
  if (user == "user1") {
    thisPlayerCells = roomData.user1fields;
    opponentPlayerCells = roomData.user2fields;
    thisPlayer = roomData.user1symbol;
    wins.value = roomData.user1wins;
    ties.value = roomData.ties;
    losses.value = roomData.user2wins;
  }
  if (user == "user2") {
    thisPlayerCells = roomData.user2fields;
    opponentPlayerCells = roomData.user1fields;
    thisPlayer = roomData.user2symbol;
    wins.value = roomData.user2wins;
    ties.value = roomData.ties;
    losses.value = roomData.user1wins;
  }
  //based on who is the thisPlayer, calculate the canclick variable and the opponentplayer for display
  if (thisPlayer == "X") {
    canClick =
      thisPlayerCells.length == opponentPlayerCells.length ? true : false;
    opponentPlayer = "O";
  }
  if (thisPlayer == "O") {
    canClick =
      thisPlayerCells.length == opponentPlayerCells.length ? false : true;
    opponentPlayer = "X";
  }
  //displaying the cells
  thisPlayerCells.forEach((cell) => displayClick(cell, thisPlayer));
  opponentPlayerCells.forEach((cell) => displayClick(cell, opponentPlayer));
});

//socket event handlers
socket.on("opponent-click", (cell) => {
  opponentPlayerCells.push(cell);
  const player = thisPlayer == "X" ? "O" : "X";
  displayClick(cell, player);
  canClick = true;
});
socket.on("lose", () => {
  losses.value++;
  sessionStorage.setItem("losses", losses.value);
  winLose.losses = losses.value;
  winnerStore.winner = thisPlayer == "X" ? "O" : "X";
  winnerStore.thisPlayer = thisPlayer;
});
socket.on("set-opponent", (user) => {
  thisPlayer = user;
});
socket.on("tie", () => {
  ties.value++;
  sessionStorage.setItem("ties", ties.value);
  winLose.ties = ties.value;
  winnerStore.winner = "tie";
});
socket.on("sync-error", () => {
  thisPlayer = "O";
  alert("Te lettél az 'O' játékos!");
  canClick = false;
  thisPlayerCells.forEach((cell) => {
    const cells = document.querySelectorAll("[data-cell]");
    const actualCell = cells.find(
      (field) => field.getAttribute("data-cell") == cell
    );
    actualCell.classList.remove("X");
    actualCell.classList.add("O");
  });
});

//handling the user clicks
function registerClick(cell) {
  //if its not your turn, return immediately
  if (!canClick) return;
  //if its the first click then set the users on the server
  if (thisPlayerCells.length == 0 && opponentPlayerCells.length == 0) {
    if (thisPlayer == null) thisPlayer = "X";
    socket.emit("set-user", { username: username, room: room });
  }
  //if the user clicked on an already registered cell then return
  if (thisPlayerCells.includes(cell) || opponentPlayerCells.includes(cell))
    return;
  //if the click is valid then store, diplay and send it to the server
  thisPlayerCells.push(cell);
  canClick = false;
  displayClick(cell, thisPlayer);
  socket.emit("click", { cell: cell, username: username, room: room });
  if (isWinner()) gameOver(); //if we have the winner, call the gameOver
}

//checking for winner
let allSymbols = 0;
function isWinner() {
  let winner = false;
  winningSchemas.forEach((schema) => {
    let matchingCells = 0;
    schema.forEach((cell) => {
      if (!thisPlayerCells.includes(cell)) return; //if the cell isnt in the users cells, then return
      matchingCells++; //if it is in the users cells, then increase the matching cells
    });
    if (matchingCells == 3) winner = true; //if matching cells is 3, then all of the cells(winning schema) in the users cells, which means that he is the winner
  });
  allSymbols = thisPlayerCells.length + opponentPlayerCells.length;
  if (allSymbols == 9) winner = true; //if there is no place left, return true then the game over function will take care of it
  return winner;
}

//handling game over
function gameOver() {
  //in case of tie
  if (allSymbols == 9) {
    socket.emit("tie", { room: room });
    ties.value++;
    sessionStorage.setItem("ties", ties.value);
    winLose.ties = ties.value;
    winnerStore.winner = "tie";
    return;
  }
  // in case of winning
  wins.value++;
  sessionStorage.setItem("wins", wins.value);
  winLose.wins = wins.value;
  winnerStore.winner = thisPlayer == "X" ? "X" : "O";
  winnerStore.thisPlayer = thisPlayer;
  socket.emit("win", { player: thisPlayer, room: room });
}

//displaying clicks
function displayClick(cell, player) {
  const cells = document.querySelectorAll("[data-cell]");
  cells.forEach((element) => {
    if (element.getAttribute("data-cell") == cell) {
      element.innerHTML = player;
      element.classList.add(player);
    }
  });
}
</script>

<template>
  <div class="container df">
    <div class="header df">
      <div class="symbols df">
        <p class="X-icon">X</p>
        <p class="O-icon">O</p>
      </div>
      <div class="exit rounded" @click="exit">Kilépés</div>
    </div>
    <div class="cells">
      <div class="cell" data-cell="0" @click="registerClick(0)"></div>
      <div class="cell" data-cell="1" @click="registerClick(1)"></div>
      <div class="cell" data-cell="2" @click="registerClick(2)"></div>
      <div class="cell" data-cell="3" @click="registerClick(3)"></div>
      <div class="cell" data-cell="4" @click="registerClick(4)"></div>
      <div class="cell" data-cell="5" @click="registerClick(5)"></div>
      <div class="cell" data-cell="6" @click="registerClick(6)"></div>
      <div class="cell" data-cell="7" @click="registerClick(7)"></div>
      <div class="cell" data-cell="8" @click="registerClick(8)"></div>
    </div>
    <div class="wins df">
      <div class="you count rounded">Győzelem: {{ wins }}</div>
      <div class="ties count rounded">Döntetlen: {{ ties }}</div>
      <div class="opponent count rounded">Vereség: {{ losses }}</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  flex-direction: column;
  gap: 2rem;
}
.header {
  justify-content: space-between;
  align-items: center;
}
.symbols {
  font-weight: bold;
  font-size: 2rem;
}
.X-icon {
  color: var(--X-color);
}
.O-icon {
  color: var(--O-color);
}
.exit {
  background-color: var(--grey);
  color: var(--bg-color);
  cursor: pointer;
}
.cells {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 3rem;
}
@media (max-width: 1300px) {
  .count {
    font-size: 1.2rem;
  }
}
@media (max-width: 450px) {
  .cells {
    gap: 1rem;
  }
}
@media (max-width: 350px) {
  .container {
    width: 100vw;
    gap: 1rem;
  }
  .header {
    justify-content: center;
  }
  .cells {
    gap: 0.2rem;
    place-items: center;
  }
  .wins {
    justify-content: center;
    gap: 0.2rem;
    translate: 2px 0;
  }
}
.cell {
  cursor: pointer;
  min-width: 90px;
  width: var(--place-width);
  aspect-ratio: 1;
  background-color: var(--place-bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 4rem;
}
.X {
  color: var(--X-color);
}
.O {
  color: var(--O-color);
}
.wins {
  justify-content: space-between;
}
.count {
  min-width: 90px;
  width: var(--place-width);
  color: var(--bg-color);
}
.you {
  background-color: var(--X-color);
}
.ties {
  background-color: var(--grey);
}
.opponent {
  background-color: var(--O-color);
}
</style>
