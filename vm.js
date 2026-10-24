```javascript
const startButton = document.getElementById("start");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const status = document.getElementById("status");
const message = document.getElementById("message");
const placeholder = document.getElementById("placeholder");
const screenContainer = document.getElementById("screen_container");
const vmContainer = document.getElementById("vm");

let emulator = null;
let loading = false;

// Fullscreen using the browser's fullscreen API.
fullscreenBtn.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await vmContainer.requestFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen error:", error);
    message.textContent =
      "Fullscreen failed. Try refreshing the page and clicking again.";
  }
});

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.textContent = document.fullscreenElement
    ? "✕ Exit Fullscreen"
    : "⛶ Fullscreen";
});

// Ask the browser to capture the mouse when the VM is clicked.
screenContainer.addEventListener("click", () => {
  if (!emulator) return;

  try {
    if (typeof emulator.lock_mouse === "function") {
      emulator.lock_mouse();
    }
  } catch (error) {
    console.warn("Mouse lock unavailable:", error);
  }
});

startButton.addEventListener("click", async () => {
  if (loading || emulator) return;

  loading = true;
  startButton.disabled = true;
  status.textContent = "Loading NovaVM...";
  message.textContent = "Preparing KolibriOS.";

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
        url: "/NovaVM/kolibrios-fda.img",
        async: false
      },
      boot_order: 0x231,
      autostart: true
    });

    emulator.add_listener("emulator-started", () => {
      status.textContent = "Virtual PC running";
      message.textContent =
        "KolibriOS is starting. Click inside the screen to use the mouse.";
    });

    emulator.add_listener("emulator-ready", () => {
      status.textContent = "Emulator ready";
      message.textContent = "Your virtual PC is ready.";
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
```
