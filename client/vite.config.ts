import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import dotenv from "dotenv";
dotenv.config();

const VITE_API_URL = process.env.VITE_API_URL || "http://localhost:3310";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 3000,
    proxy: {
      // methode secret hahaah pour cachée l'api on utilisée un proxy qui vas rediriger les requete "/api" vers l'api real sans que l'utilisateurs ou les personne mal intentionner puisse voir l'api real
      "/api": {
        target: VITE_API_URL,
        changeOrigin: true,
      },
    },
  },
});
