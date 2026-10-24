
const status = document.getElementById("status");
const message = document.getElementById("message");
const startButton = document.getElementById("start");

startButton.addEventListener("click", async () => {
  status.textContent = "Preparing virtual machine...";
  message.textContent =
    "NovaVM is checking the emulator connection.";

  startButton.disabled = true;

  try {
    const response = await fetch(
      "https://copy.sh/v86/build/libv86.js"
    );

    if (!response.ok) {
      throw new Error("Emulator runtime could not be loaded.");
    }

    status.textContent = "Emulator runtime available";
    message.textContent =
      "The emulator library loaded. Next we need a compatible Linux image and BIOS files.";
    startButton.textContent = "Runtime ready";
  } catch (error) {
    status.textContent = "Connection failed";
    message.textContent =
      "Could not load the emulator. Check your internet connection and try again.";
    startButton.disabled = false;
    startButton.textContent = "Retry connection";
    console.error(error);
  }
});
