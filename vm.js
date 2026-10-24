const startButton = document.getElementById("start");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const mouseBtn = document.getElementById("mouseBtn");
const status = document.getElementById("status");
const message = document.getElementById("message");
const placeholder = document.getElementById("placeholder");
const screenContainer = document.getElementById("screen_container");
const vmContainer = document.getElementById("vm");

let emulator = null;
let loading = false;

function showError(error) {
  console.error("NovaVM error:", error);
  status.textContent = "Startup failed";
  message.textContent = error?.message || String(error);
  startButton.disabled = false;
  startButton.textContent = "Retry boot";
  placeholder.hidden = false;
  screenContainer.hidden = true;
  emulator = null;
}

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
          reject(new Error("Could not load libv86.js. Check the file in GitHub."));
        document.head.appendChild(script);
      });
    }

    if (!window.V86) {
      throw new Error("The V86 constructor was not found in libv86.js.");
    }

    if (!screenContainer.querySelector("canvas")) {
      throw new Error(
        "The screen container is missing its canvas. Check index.html."
      );
    }

    placeholder.hidden = true;
    screenContainer.hidden = false;

    const newEmulator = new window.V86({
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

    emulator = newEmulator;

    emulator.add_listener("emulator-started", () => {
      status.textContent = "Virtual PC running";
      message.textContent = "KolibriOS is starting.";
    });

    emulator.add_listener("emulator-ready", () => {
      status.textContent = "Emulator ready";
      message.textContent = "NovaVM is ready.";
    });
  } catch (error) {
    showError(error);
  } finally {
    loading = false;
  }
});

fullscreenBtn?.addEventListener("click", async () => {
  try {
    if (!emulator) {
      message.textContent = "Boot NovaVM before using fullscreen.";
      return;
    }

    if (typeof emulator.screen_go_fullscreen === "function") {
      emulator.screen_go_fullscreen();
    } else if (vmContainer?.requestFullscreen) {
      await vmContainer.requestFullscreen();
    } else {
      throw new Error("Fullscreen is not supported by this browser.");
    }
  } catch (error) {
    console.error("Fullscreen error:", error);
    message.textContent = "Fullscreen failed: " + error.message;
  }
});

document.addEventListener("fullscreenchange", () => {
  if (fullscreenBtn) {
    fullscreenBtn.textContent = document.fullscreenElement
      ? "Exit Fullscreen"
      : "⛶ Fullscreen";
  }
});

mouseBtn?.addEventListener("click", () => {
  if (!emulator) {
    message.textContent = "Boot NovaVM before locking the mouse.";
    return;
  }

  if (typeof emulator.lock_mouse === "function") {
    emulator.lock_mouse();
    message.textContent = "Mouse lock requested.";
  } else {
    message.textContent = "Mouse locking is not supported by this v86 build.";
  }
});

window.addEventListener("error", (event) => {
  console.error("NovaVM page error:", event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("NovaVM loading error:", event.reason);
  message.textContent =
    "Loading error: " +
    (event.reason?.message || String(event.reason));
});
