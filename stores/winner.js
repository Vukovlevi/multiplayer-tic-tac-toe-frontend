import { defineStore } from "pinia";
export const useWinnerStore = defineStore("winner", {
  state: () => ({ winner: "", thisPlayer: "" }),
});
