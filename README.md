# 📺 TV Workers

Cloudflare Worker–based IPTV proxy for streaming HLS channels with automatic playlist rewriting and CORS support.

[Farsi Version](README_FA.md)

### Video Tutorial (Farsi):

<video controls width="640">
  <source src="https://raw.githubusercontent.com/frank-vpl/TV-Workers/refs/heads/master/m3u8.mp4" type="video/mp4">
  Your browser does not support HTML5 video.
</video>

## 🚀 Features

* Proxy IPTV HLS streams (`.m3u8`)
* Automatic playlist URL rewriting
* Segment streaming support (`.ts`, `.m4s`, etc.)
* Dynamic headers (User-Agent, Referer, Origin)
* CORS enabled (`Access-Control-Allow-Origin: *`)
* Lightweight and fast (Cloudflare Workers)

---

## 📂 Project Structure

```
worker.js
README.md
```

---

## 🛠 How It Works

The Worker:

1. Reads the channel ID from the URL path
2. Matches it against the `CHANNELS` object
3. Proxies the request to the real IPTV source
4. Rewrites `.m3u8` playlists to pass back through your Worker
5. Streams video segments directly

---

## ➕ Adding an IPTV Channel

Open `worker.js` and locate:

```js
// IPTV Channels
const CHANNELS = {
  "2342": "https://live.livetvstream.co.uk/LS-63503-4",
  // "1001": "https://example.com/live/stream1"
}
```

To add a new IPTV stream:

1. Find the base stream URL
   Example:

```
https://live.livetvstream.co.uk/LS-63503-4/index.m3u8
```

2. Remove `/index.m3u8`
   Keep only the base path:

```
https://live.livetvstream.co.uk/LS-63503-4
```

3. Add it to `CHANNELS`:

```js
const CHANNELS = {
  "2342": "https://live.livetvstream.co.uk/LS-63503-4",
  "1001": "https://example.com/live/channel"
}
```

---

## 🔗 Accessing a Channel

After deploying your Worker, access streams like this:

```
https://workername.username.workers.dev/{id}/index.m3u8
```

### Example

If your Worker URL is:

```
https://tv-proxy.frank.workers.dev
```

And your channel ID is:

```
2342
```

Stream URL:

```
https://tv-proxy.frank.workers.dev/2342/index.m3u8
```

---

## ☁️ Deploy to Cloudflare Workers

### 1️⃣ Install Wrangler

```bash
npm install -g wrangler
```

### 2️⃣ Login

```bash
wrangler login
```

### 3️⃣ Deploy

```bash
wrangler deploy
```

After deployment, Cloudflare will provide:

```
https://your-worker-name.your-username.workers.dev
```

---

## 📡 Example Channel Configuration

Source:

```
https://live.livetvstream.co.uk/LS-63503-4/index.m3u8
```

Worker config:

```js
"2342": "https://live.livetvstream.co.uk/LS-63503-4",
```

Worker stream URL:

```
https://workername.username.workers.dev/2342/index.m3u8
```

---

## ⚠️ Notes

* Only use streams you have permission to proxy.
* Some IPTV providers may block proxy usage.
* Adjust cache settings if needed.
* Ensure the base URL does NOT include `index.m3u8`.

---

## 📜 License

[MIT License](./LICENSE)