import { defineStore } from "pinia";
export const useWinLoseStore = defineStore("winLose", {
  state: () => ({ wins: 0, losses: 0, ties: 0 }),
});
