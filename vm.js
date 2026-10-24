
const startButton = document.getElementById("start");
const status = document.getElementById("status");
const message = document.getElementById("message");
const placeholder = document.getElementById("placeholder");
const screenContainer = document.getElementById("screen_container");

let emulator = null;
let loading = false;

startButton.addEventListener("click", async () => {
  if (loading || emulator) return;

  loading = true;
  startButton.disabled = true;
  status.textContent = "Loading emulator...";
  message.textContent = "Preparing NovaVM...";

  try {
    if (!window.V86) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./libv86.js";
        script.onload = resolve;
        script.onerror = () =>
          reject(new Error("Could not load local libv86.js."));
        document.head.appendChild(script);
      });
    }

    placeholder.hidden = true;
    screenContainer.hidden = false;
    status.textContent = "Starting virtual PC...";

    emulator = new window.V86({
      wasm_path: "./",
      memory_size: 128 * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      screen_container: screenContainer,
      bios: { url: "./seabios.bin" },
      vga_bios: { url: "./vgabios.bin" },
      autostart: false
    });

    emulator.add_listener("emulator-ready", () => {
      status.textContent = "Emulator ready";
      message.textContent =
        "The emulator is ready, but a Linux disk image is still needed.";
    });

  } catch (error) {
    console.error("NovaVM error:", error);
    emulator = null;
    placeholder.hidden = false;
    screenContainer.hidden = true;
    status.textContent = "Startup failed";
    message.textContent = error.message;
    startButton.disabled = false;
    startButton.textContent = "Retry boot";
  } finally {
    loading = false;
  }
});
