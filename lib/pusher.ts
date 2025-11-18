import PusherClient from "pusher-js";

// Konfigurasi Soketi default (berjalan secara lokal di port 6001)
export const pusherClient = new PusherClient(
  "app-key", // Kunci default Soketi
  {
    wsHost: "127.0.0.1",
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    cluster: "mt1", // Required property for Pusher options
  }
);
