import { defineStore } from "pinia";
export const useRoomDataStore = defineStore("roomData", {
  state: () => ({ roomData: {} }),
});
