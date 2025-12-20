module.exports = {
    apps: [
        {
            name: "impostor-game-server",
            script: "./src/index.js",
            instances: "max", // Use all available CPU cores
            exec_mode: "cluster", // Enable cluster mode for load balancing
            watch: false, // Disable watch in production
            env: {
                NODE_ENV: "production",
            },
            env_development: {
                NODE_ENV: "development",
                watch: true, // Enable watch in development
            },
            // Restart policy
            max_memory_restart: "500M", // Restart if memory exceeds 500MB
            min_uptime: "10s", // Consider app crashed if it exits within 10s
            max_restarts: 10, // Max restarts within 1 minute before giving up
            autorestart: true, // Auto restart on crash

            // Logging
            error_file: "./logs/pm2-error.log",
            out_file: "./logs/pm2-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true, // Combine logs from all instances

            // Performance optimizations
            kill_timeout: 5000, // Time to wait before force killing (ms)
            listen_timeout: 3000, // Time to wait for app to be ready (ms)
            shutdown_with_message: true, // Graceful shutdown support

            // Instance variables (accessible via process.env.NODE_APP_INSTANCE)
            instance_var: "INSTANCE_ID",
        },
    ],
};
