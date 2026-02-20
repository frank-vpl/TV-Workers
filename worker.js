// IPTV Channels
const CHANNELS = {
  "2342": "https://live.livetvstream.co.uk/LS-63503-4",
  // "1001": "https://example.com/live/stream1"
}

export default {
  async fetch(request) {
    try {
      const url = new URL(request.url)
      const parts = url.pathname.split('/').filter(Boolean)

      const id = parts[0]
      const rest = parts.slice(1).join('/')

      const base = CHANNELS[id]
      if (!base) {
        return new Response('Channel not found', { status: 404 })
      }

      const baseUrl = new URL(base)

      // Build target URL dynamically
      let targetUrl
      if (rest) {
        targetUrl = new URL(rest, baseUrl + '/')
      } else {
        targetUrl = new URL('index.m3u8', baseUrl + '/')
      }

      // Dynamic headers based on origin
      const headers = {
        "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0",
        "Referer": baseUrl.origin + "/",
        "Origin": baseUrl.origin
      }

      const response = await fetch(targetUrl.toString(), { headers })

      const contentType = response.headers.get("content-type") || ""

      // 🔥 Rewrite HLS playlists
      if (
        contentType.includes("application/vnd.apple.mpegurl") ||
        contentType.includes("application/x-mpegURL") ||
        targetUrl.pathname.endsWith(".m3u8")
      ) {
        let text = await response.text()

        // Rewrite absolute URLs
        text = text.replaceAll(
          baseUrl.origin,
          `${url.origin}/${id}`
        )

        // Rewrite relative segment paths
        text = text.replaceAll(
          baseUrl.pathname.replace(/\/$/, '') + '/',
          `${url.origin}/${id}/`
        )

        return new Response(text, {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
          }
        })
      }

      // 🎥 Stream segments (.ts, .m4s, etc.)
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30"
        }
      })

    } catch (err) {
      return new Response("Proxy Error: " + err.message, { status: 500 })
    }
  }
}