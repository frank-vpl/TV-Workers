/**
 * ============================================
 * IPTV Reverse Proxy - Cloudflare Worker
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
  "1234": "https://3abn.bozztv.com/3abn2/3abn_live/smil:3abn_live.smil"
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
      const restPath = pathParts.slice(1).join("/")   // segment path
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

        let playlistText = await upstreamResponse.text()

        const proxyBase = `${requestUrl.origin}/${channelId}`

        // --------------------------------------------
        // Rewrite absolute URLs
        // --------------------------------------------
        playlistText = playlistText.replace(
          /https?:\/\/[^"\s]+/g,
          (url) => url.replace(upstreamUrl.origin, proxyBase)
        )

        // --------------------------------------------
        // Rewrite relative paths (preserve query!)
        // --------------------------------------------
        playlistText = playlistText.replace(
          /^([^#][^\r\n]*)/gm,
          (line) => {
            if (line.startsWith("http")) return line
            if (line.trim() === "") return line
            return `${proxyBase}/${line}`
          }
        )

        // --------------------------------------------
        // Rewrite EXT-X-KEY URIs
        // --------------------------------------------
        playlistText = playlistText.replace(
          /URI="([^"]+)"/g,
          (match, uri) => {
            if (uri.startsWith("http")) {
              const filename = uri.split("/").pop()
              return `URI="${proxyBase}/${filename}"`
            }
            return `URI="${proxyBase}/${uri}"`
          }
        )

        return new Response(playlistText, {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "public, max-age=10"
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
