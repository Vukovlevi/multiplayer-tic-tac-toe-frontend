function exitGame(socket, room) {
  localStorage.removeItem("code");
  sessionStorage.removeItem("wins");
  sessionStorage.removeItem("losses");
  sessionStorage.removeItem("ties");
  sessionStorage.removeItem("isGameOver");
  sessionStorage.removeItem("winnerStore");
  if (room != null) socket.emit("exit", room);
  document.location.reload();
}
export default exitGame;
