module.exports = {
  apps: [
    {
      name: "dreamxec-api",
      script: "./server.js",
      instances: process.env.PM2_INSTANCES || "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        UV_THREADPOOL_SIZE: 64,
      },
    },
  ],
};
