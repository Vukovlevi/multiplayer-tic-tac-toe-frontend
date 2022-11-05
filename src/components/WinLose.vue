<script setup>
import { io } from "socket.io-client";
import { useWinnerStore } from "../../stores/winner";
import exitGame from "../utilities/exit";

//socket.io config
const PORT = import.meta.env.VITE_APP_PORT;
const socket = io(PORT);

//stores and utilities setup
const winnerStore = useWinnerStore();
const exit = () => exitGame(socket, room);

//configuring the emits to the App.vue
const emits = defineEmits(["nextRound"]);

//setting up the basic variables
const room = localStorage.getItem("code");
let yourState = "";
let winner = "";
let xColor;
let tie;
const preWinnerStore =
  JSON.parse(sessionStorage.getItem("winnerStore")) || null;
//if the current state is gameOver, display that state
if (preWinnerStore != null) {
  winnerStore.winner = preWinnerStore.winner;
  winnerStore.thisPlayer = preWinnerStore.thisPlayer;
  displayWinner();
}
socket.emit("next-round", { preConnect: true, room: room });

//in case of game over, handle and display it
winnerStore.$subscribe(() => {
  xColor = false;
  tie = false;
  displayWinner();
  const storageWinnerStore = {
    winner: winnerStore.winner,
    thisPlayer: winnerStore.thisPlayer,
  };
  sessionStorage.setItem("winnerStore", JSON.stringify(storageWinnerStore));
});

//display the winner
function displayWinner() {
  winner = winnerStore.winner;
  if (winner == winnerStore.thisPlayer) yourState = "Nyertél!";
  if (winner != winnerStore.thisPlayer) yourState = "Vesztettél!";
  if (winner == "X") xColor = true;
  if (winner == "tie") {
    yourState = "Döntetlen!";
    winner = "Senki sem";
    tie = true;
  }
}

//socket event handlers
socket.on("reseted", () => {
  emits("nextRound");
});

//handling next round
function nextRound() {
  socket.emit("next-round", { room: room });
  emits("nextRound");
}
</script>
<template>
  <div>
    <div class="win-lose-container df">
      <div class="your-state">{{ yourState }}!</div>
      <div
        class="winner"
        :class="{ 'X-color': xColor, 'O-color': !xColor, tie: tie }"
      >
        {{ winner }} győzött!
      </div>
      <div class="controller df">
        <button
          class="next-round rounded btn"
          :class="{ 'X-color': !xColor, 'O-color': xColor, tie: tie }"
          @click="nextRound()"
        >
          Következő kör!
        </button>
        <button class="exit rounded btn" @click="exit">Kilépés</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.win-lose-container {
  position: absolute;
  height: 40vh;
  width: 100vw;
  left: 0;
  top: 50%;
  translate: 0% -50%;
  background-color: var(--place-bg-color);
  flex-direction: column;
  gap: 2.5rem;
  align-items: center;
  justify-content: center;
}
@media (max-height: 700px) {
  .win-lose-container {
    height: 350px;
  }
}
.your-state {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--grey);
  text-transform: uppercase;
}
.winner {
  font-size: 3rem;
  font-weight: bold;
}
@media (max-width: 450px) {
  .winner {
    text-align: center;
  }
}
.winner.X-color {
  color: var(--X-color);
}
.winner.O-color {
  color: var(--O-color);
}
.winner.tie {
  color: var(--grey) !important;
}
.next-round.X-color {
  background-color: var(--X-color);
}
.next-round.O-color {
  background-color: var(--O-color);
}
.next-round.tie {
  background-color: var(--grey) !important;
}
.next-round,
.exit {
  border: 0;
  outline: 0;
  cursor: pointer;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--bg-color);
}
.exit {
  background-color: var(--grey);
}
.next-round:hover,
.next-round:focus,
.exit:focus,
.exit:hover {
  opacity: 0.7;
  outline: 1px solid #000;
}
</style>
