[Farsi version](https://github.com/absh1234/TV-Workers-panel-/blob/master/README_FA.md)

# 📡 IPTV Proxy & Manager (Cloudflare Workers)

A high-performance IPTV proxy and management panel built on Cloudflare Workers. This project allows you to bypass CORS restrictions, manage your HLS streams, and customize your channel list with an easy-to-use web interface.

## 🚀 Features
- **HLS Proxying:** Bypasses CORS and Referer restrictions for seamless playback.
- **Visual Panel:** Add, Edit, and Remove channels directly from the browser.
- **Drag & Drop Reordering:** Organize your channels visually; the order is saved permanently.
- **Adaptive Stream Support:** Automatically tests various suffixes (index.m3u8, playlist.m3u8, etc.) to find the working stream.
- **KV Storage:** All data is securely stored in your Cloudflare KV Namespace.

## 🛠 Installation Guide

### Step 1: Create KV Namespace
1. Log in to your **Cloudflare Dashboard**.
2. Go to **Workers & Pages** > **KV**.
3. Click **Create Namespace** and name it `CUSTOM_CHANNELS`.
4. Note down the **ID** of the created namespace.

### Step 2: Deploy the Worker
1. Go to **Workers & Pages** > **Create application** > **Create Worker**.
2. Give your worker a name (e.g., `my-iptv-proxy`).
3. Click **Deploy**.
4. After deployment, click **Edit Code** and paste the content of `worker.js`.

### Step 3: Bind KV to Worker
1. Inside your Worker's dashboard, go to the **Settings** tab.
2. Select **Variables**.
3. Under **KV Namespace Bindings**, click **Add binding**.
4. Set **Variable name** to `CUSTOM_CHANNELS`.
5. Select the namespace you created in Step 1.
6. Click **Save and Deploy**.

## 🖥 How to Use
1. Open your Worker URL (e.g., `https://my-iptv-proxy.workers.dev`).
2. Use the **+** button to add a new channel (Name, HLS URL, and Logo).
3. **Drag and Drop** the channel cards to change their display order.
4. Click on any channel card to start the web player.
5. Use the **Edit (Pencil)** icon to modify or delete existing channels.

---

## 📄 License
MIT License - Feel free to use and contribute!
