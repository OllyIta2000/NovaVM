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

function setStatus(text) {
  if (status) status.textContent = text;
}

function setMessage(text) {
  if (message) message.textContent = text;
}

function showError(error) {
  console.error("NovaVM startup error:", error);
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
    const existingScript = document.querySelector(
      'script[src*="libv86.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load libv86.js.")),
        { once: true }
      );

      if (typeof window.V86 === "function") resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "./libv86.js";
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Could not load libv86.js."));

    document.head.appendChild(script);
  });

  if (typeof window.V86 !== "function") {
    throw new Error(
      "libv86.js loaded, but the V86 constructor was not found."
    );
  }
}

async function bootNovaVM() {
  if (loading || emulator) return;

  loading = true;

  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = "Starting...";
  }

  setStatus("Loading NovaVM...");
  setMessage("Loading the emulator library.");

  try {
    if (!screenContainer) {
      throw new Error(
        "The screen_container element is missing from index.html."
      );
    }

    await loadV86();

    if (placeholder) placeholder.hidden = true;
    screenContainer.hidden = false;

    setMessage("Starting KolibriOS. Please wait.");

    const options = {
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
    };

    emulator = new window.V86(options);

    emulator.add_listener("emulator-started", () => {
      setStatus("Virtual PC running");
      setMessage("KolibriOS is starting.");
    });

    emulator.add_listener("emulator-ready", () => {
      setStatus("Emulator ready");
      setMessage("NovaVM is ready.");
      if (startButton) startButton.textContent = "NovaVM Running";
    });
  } catch (error) {
    showError(error);
  } finally {
    loading = false;

    if (!emulator && startButton) {
      startButton.disabled = false;
    }
  }
}

if (startButton) {
  startButton.addEventListener("click", bootNovaVM);
} else {
  console.error('NovaVM: Could not find the button with id="start".');
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", async () => {
    if (!emulator) {
      setMessage("Boot NovaVM before using fullscreen.");
      return;
    }

    try {
      if (typeof emulator.screen_go_fullscreen === "function") {
        emulator.screen_go_fullscreen();
      } else if (vmContainer?.requestFullscreen) {
        await vmContainer.requestFullscreen();
      } else {
        throw new Error("Fullscreen is not supported.");
      }
    } catch (error) {
      setMessage("Fullscreen failed: " + error.message);
    }
  });
}

if (mouseBtn) {
  mouseBtn.addEventListener("click", () => {
    if (!emulator) {
      setMessage("Boot NovaVM before locking the mouse.");
      return;
    }

    if (typeof emulator.lock_mouse === "function") {
      emulator.lock_mouse();
      setMessage("Mouse lock requested.");
    } else {
      setMessage("Mouse locking is not supported.");
    }
  });
}

document.addEventListener("fullscreenchange", () => {
  if (fullscreenBtn) {
    fullscreenBtn.textContent = document.fullscreenElement
      ? "Exit Fullscreen"
      : "⛶ Fullscreen";
  }
});

console.log("NovaVM: vm.js loaded.");
console.log("NovaVM: Boot button found:", !!startButton);
