# 🌐 Tailscale Private Access

This guide explains how to safely access **Habit Quest** from anywhere in the world using [Tailscale](https://tailscale.com/).

## 🔒 Security Model

Unlike traditional port-forwarding, Tailscale creates a private **WireGuard-based mesh network** (Tailnet) between your devices.

### Why this is secure:
1.  **End-to-End Encryption**: All data between your server and your devices is encrypted using WireGuard.
2.  **No Public Ports**: You do not need to open any ports on your router or firewall.
3.  **Automatic HTTPS**: Tailscale provisions legitimate Let's Encrypt certificates for your `.ts.net` address.
4.  **Identity Middleware**: The backend is configured to detect and log the `Tailscale-User-Login` header, ensuring you know exactly which device is accessing the app.
5.  **Local Isolation**: The app runs on a standard HTTP port (`3000`) locally, which is only accessible to the Tailscale proxy on the same machine. No unencrypted traffic ever touches the local network hardware.

---

## 🚀 Setup Instructions

### ⚡ Quick Start (Recommended)
You can automate the entire process using the provided script:
```powershell
./start-tailscale.ps1
```
This will launch the backend in a new window and start the Tailscale proxy in your current terminal.

---

### Manual Setup Instructions

### 1. Install Tailscale
Install Tailscale on both your **server** (the computer running this app) and your **client** (your phone, tablet, or another laptop).
- [Download Tailscale](https://tailscale.com/download)

### 2. Enable Tailscale Serve
On your server machine, run the following command to securely proxy the local app:

```powershell
tailscale serve http://localhost:3000
```

### 3. Get Your Secure URL
Run this command to see your public-within-tailnet URL:
```powershell
tailscale serve status
```
It will look something like: `https://kreato-droid.tailnet-name.ts.net/`

### 4. Access on Any Device
Simply open that URL in any browser on any device that has Tailscale active and is logged into your account.

---

## 🛠 Troubleshooting

-   **"Site cannot be reached"**: Ensure Tailscale is running on both the server and the device you are using to access it.
-   **"Address already in use"**: Ensure no other process is using port 3000 before starting the server (`node src/server.js`).
-   **Serve not enabled**: If you get a message saying "Serve is not enabled on your tailnet," follow the link provided in the terminal to enable it.
