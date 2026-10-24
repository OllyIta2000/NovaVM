const startButton = document.getElementById("start");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const exitFullscreenBtn = document.getElementById("exitFullscreenBtn");
const mouseBtn = document.getElementById("mouseBtn");
const status = document.getElementById("status");
const message = document.getElementById("message");
const placeholder = document.getElementById("placeholder");
const screenContainer = document.getElementById("screen_container");
const vmContainer = document.getElementById("vm");

let emulator = null;
let loading = false;

function setStatus(text) {
  if (status) status.textContent = text;
}

function setMessage(text) {
  if (message) message.textContent = text;
}

function showError(error) {
  console.error("NovaVM error:", error);
  setStatus("Startup failed");
  setMessage(error?.message || String(error));

  if (placeholder) placeholder.hidden = false;
  if (screenContainer) screenContainer.hidden = true;

  emulator = null;
  loading = false;

  if (startButton) {
    startButton.disabled = false;
    startButton.textContent = "Retry boot";
  }
}

async function loadV86() {
  if (typeof window.V86 === "function") return;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "./libv86.js";
    script.onload = resolve;
    script.onerror = () => {
      reject(new Error("Could not load libv86.js."));
    };
    document.head.appendChild(script);
  });

  if (typeof window.V86 !== "function") {
    throw new Error("The V86 constructor was not found.");
  }
}

async function bootNovaVM() {
  if (loading || emulator) return;

  loading = true;

  startButton.disabled = true;
  startButton.textContent = "Starting...";
  setStatus("Loading NovaVM...");
  setMessage("Loading the emulator library.");

  try {
    await loadV86();

    placeholder.hidden = true;
    screenContainer.hidden = false;

    setMessage("Starting KolibriOS...");

    emulator = new window.V86({
      wasm_path: "./v86.wasm",
      memory_size: 128 * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      screen_container: screenContainer,
      bios: { url: "./seabios.bin" },
      vga_bios: { url: "./vgabios.bin" },
      fda: {
        url: "./kolibrios-fda.img",
        async: false
      },
      boot_order: 0x231,
      autostart: true
    });

    emulator.add_listener("emulator-started", () => {
      setStatus("Virtual PC running");
      setMessage("KolibriOS is starting.");
    });

    emulator.add_listener("emulator-ready", () => {
      setStatus("Emulator ready");
      setMessage("NovaVM is ready.");
      startButton.textContent = "NovaVM Running";
    });
  } catch (error) {
    showError(error);
  } finally {
    loading = false;

    if (!emulator) {
      startButton.disabled = false;
    }
  }
}

startButton.addEventListener("click", bootNovaVM);

async function enterFullscreen() {
  try {
    if (!emulator) {
      setMessage("Boot NovaVM before using fullscreen.");
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await vmContainer.requestFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen error:", error);
    setMessage("Fullscreen failed: " + error.message);
  }
}

fullscreenBtn.addEventListener("click", enterFullscreen);
exitFullscreenBtn.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = Boolean(document.fullscreenElement);

  fullscreenBtn.textContent = isFullscreen
    ? "Exit Fullscreen"
    : "⛶ Fullscreen";

  exitFullscreenBtn.style.display = isFullscreen ? "inline-block" : "none";
});

/* Hide the fullscreen exit button until fullscreen is active. */
exitFullscreenBtn.style.display = "none";

mouseBtn.addEventListener("click", () => {
  if (!emulator) {
    setMessage("Boot NovaVM before locking the mouse.");
    return;
  }

  if (typeof emulator.lock_mouse === "function") {
    emulator.lock_mouse();
    setMessage("Mouse lock requested. Press Esc if the browser allows it.");
  } else {
    setMessage("Mouse locking is not supported by this version.");
  }
});

window.addEventListener("error", (event) => {
  console.error("NovaVM page error:", event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("NovaVM loading error:", event.reason);
  setMessage(
    "Loading error: " +
    (event.reason?.message || String(event.reason))
  );
});

console.log("NovaVM: vm.js loaded.");
