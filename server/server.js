const { loadEnv } = require("./src/config/env");

(async () => {
  try {
    await loadEnv();
    // Require and start the actual server application
    require("./server-app.js");
  } catch (err) {
    console.error("❌ Critical: Failed to load environment configuration:", err);
    process.exit(1);
  }
})();
