
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
  message.textContent = "Loading the virtual PC runtime. This may take a while.";

  try {
    if (!window.V86) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://copy.sh/v86/build/libv86.js";
        script.onload = resolve;
        script.onerror = () => reject(
          new Error("Could not load the emulator library.")
        );
        document.head.appendChild(script);
      });
    }

    status.textContent = "Starting Linux...";
    placeholder.hidden = true;
    screenContainer.hidden = false;

    emulator = new window.V86({
      wasm_path: "https://copy.sh/v86/build/v86.wasm",
      memory_size: 128 * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      screen_container: screenContainer,
      bios: {
        url: "https://copy.sh/v86/bios/seabios.bin"
      },
      vga_bios: {
        url: "https://copy.sh/v86/bios/vgabios.bin"
      },
      cdrom: {
        url: "https://copy.sh/v86/images/linux.iso"
      },
      autostart: true
    });

    emulator.add_listener("emulator-ready", () => {
      status.textContent = "Virtual PC running";
    });

    emulator.add_listener("emulator-started", () => {
      status.textContent = "Linux booting...";
    });

  } catch (error) {
    console.error("NovaVM error:", error);

    emulator = null;
    placeholder.hidden = false;
    screenContainer.hidden = true;
    status.textContent = "Startup failed";
    message.textContent =
      error.message +
      " Check your connection, then try again.";

    startButton.textContent = "Retry boot";
    startButton.disabled = false;
  } finally {
    loading = false;
  }
});
