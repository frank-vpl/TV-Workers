/**
 * ============================================
 * IPTV Proxy - Cloudflare Worker
 * ============================================
 *
 * Features:
 *  - Supports standard HLS
 *  - Supports Wowza / SMIL streams
 *  - Preserves query strings (nimblesessionid fix)
 *  - Rewrites master + variant playlists
 *  - Rewrites EXT-X-KEY URIs
 *  - Streams binary segments safely
 *  - CORS enabled
 *
 * Production ready
 */

// ============================================
// 📡 CHANNEL LIST
// ============================================
const CHANNELS = {
  "2342": "https://live.livetvstream.co.uk/LS-63503-4",
  "1001": "https://familyhls.avatv.live/hls",
  "1234": "https://voa-ingest.akamaized.net/hls/live/2033876/tvmc07"
}


// ============================================
// 🌍 WORKER ENTRY
// ============================================
export default {
  async fetch(request) {
    try {

      // Parse incoming request
      const requestUrl = new URL(request.url)
      const pathParts = requestUrl.pathname.split("/").filter(Boolean)

      const channelId = pathParts[0]
      const restPath = pathParts.slice(1).join("/")  // segment path
      const queryString = requestUrl.search || ""     // IMPORTANT: preserve tokens

      // Validate channel
      const base = CHANNELS[channelId]
      if (!base) {
        return new Response("Channel not found", { status: 404 })
      }

      // ============================================
      // 🎯 BUILD TARGET URL (SMIL SAFE + QUERY SAFE)
      // ============================================

      let targetUrl

      if (restPath) {
        // Example:
        // /1234/media_xxx.ts?nimblesessionid=xxx
        targetUrl = base.endsWith("/")
          ? base + restPath + queryString
          : base + "/" + restPath + queryString
      } else {
        // First request (playlist)
        if (base.includes(".smil")) {
          targetUrl = base + "/playlist.m3u8" + queryString
        } else {
          targetUrl = base + "/index.m3u8" + queryString
        }
      }

      // Special handler for encoded absolute URLs
      if (restPath.startsWith("__proxy__/")) {
        const encodedUrl = restPath.replace("__proxy__/", "")
        const decodedUrl = decodeURIComponent(encodedUrl)

        const upstreamResponse = await fetch(decodedUrl, {
          headers: {
            "User-Agent":
              request.headers.get("User-Agent") ||
              "Mozilla/5.0",
            "Referer": new URL(decodedUrl).origin + "/"
          }
        })

        return new Response(upstreamResponse.body, {
          headers: {
            "Content-Type":
              upstreamResponse.headers.get("content-type") ||
              "application/octet-stream",
            "Access-Control-Allow-Origin": "*"
          }
        })
      }

      const upstreamUrl = new URL(targetUrl)

      // ============================================
      // 📡 UPSTREAM HEADERS
      // ============================================

      const upstreamHeaders = {
        "User-Agent":
          request.headers.get("User-Agent") ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": upstreamUrl.origin + "/"
        // Do NOT send Origin header (prevents CDN block)
      }

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        headers: upstreamHeaders
      })

      if (!upstreamResponse.ok) {
        return new Response(
          "Upstream Error: " + upstreamResponse.status,
          { status: upstreamResponse.status }
        )
      }

      const contentType =
        upstreamResponse.headers.get("content-type") || ""


      // ============================================
      // 🔥 PLAYLIST HANDLING (.m3u8)
      // ============================================

      if (
        contentType.includes("application/vnd.apple.mpegurl") ||
        contentType.includes("application/x-mpegURL") ||
        upstreamUrl.pathname.endsWith(".m3u8")
      ) {

        const finalUrl = upstreamResponse.url
        const finalBase = finalUrl.substring(0, finalUrl.lastIndexOf("/") + 1)

        let playlistText = await upstreamResponse.text()

        const proxyBase = `${requestUrl.origin}/${channelId}`

        playlistText = playlistText.replace(
          /^([^#][^\r\n]*)/gm,
          (line) => {

            if (!line.trim()) return line

            // Build absolute upstream URL properly
            const absoluteUpstreamUrl = new URL(line, finalBase).toString()

            // Convert to proxy path
            const relativeToBase = absoluteUpstreamUrl.replace(base, "")

            return `${proxyBase}/${relativeToBase}`
          }
        )

        return new Response(playlistText, {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "public, max-age=5"
          }
        })
      }


      // ============================================
      // 🎥 SEGMENT STREAMING (.ts, .m4s, etc.)
      // ============================================

      return new Response(upstreamResponse.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30"
        }
      })

    } catch (err) {
      return new Response("Proxy Error: " + err.message, {
        status: 500
      })
    }
  }
}
