const { loadEnv } = require("../src/config/env");

let app;
let initPromise = null;

async function getApp() {
  if (app) return app;
  if (!initPromise) {
    initPromise = (async () => {
      await loadEnv();
      app = require("../server-app");
      return app;
    })();
  }
  return initPromise;
}

module.exports = async (req, res) => {
  const serverApp = await getApp();
  return serverApp(req, res);
};
