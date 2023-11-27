import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
  },
  server: {
    proxy: {
      "/peerjs": {
        target: "ws://localhost:3000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
    // https: {
    //   key: fs.readFileSync(
    //     "/home/marilia/dev/city-monitoring/config/certificates//localhost.key"
    //   ),
    //   cert: fs.readFileSync(
    //     "/home/marilia/dev/city-monitoring/config/certificates/localhost.crt"
    //   ),
    // },
  },
});
