
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
  status.textContent = "Loading NovaVM...";
  message.textContent = "Preparing the virtual PC.";

  try {
    if (!window.V86) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./libv86.js";
        script.onload = resolve;
        script.onerror = () =>
          reject(new Error("Could not load libv86.js."));
        document.head.appendChild(script);
      });
    }

    if (!window.V86) {
      throw new Error("The v86 constructor was not found.");
    }

    placeholder.hidden = true;
    screenContainer.hidden = false;

    emulator = new window.V86({
      wasm_path: "/NovaVM/v86.wasm",
      memory_size: 128 * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      screen_container: screenContainer,
      bios: { url: "./seabios.bin" },
      vga_bios: { url: "./vgabios.bin" },
      fda: {
        url: "/NovaVM/kolibri.img",
        async: false
      },
      boot_order: 0x231,
      autostart: true
    });

    emulator.add_listener("emulator-started", () => {
      status.textContent = "Virtual PC running";
      message.textContent = "NovaVM is starting Linux...";
    });

    emulator.add_listener("emulator-ready", () => {
      status.textContent = "Emulator ready";
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
