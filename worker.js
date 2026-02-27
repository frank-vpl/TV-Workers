/**
 * ============================================
 * IPTV Proxy & Manager - Final English Version
 * (Integrated UI Status & Grid Fix)
 * ============================================
 */

const DEFAULT_CHANNELS = {
  "1111": { url: "https://live.livetvstream.co.uk/LS-63503-4", name: "Live TV Stream", logo: 'https://img.freepik.com/free-vector/webinar-live-stream-broadcast-label-design_1017-59935.jpg?semt=ais_hybrid&w=740&q=80', order: 0 },
  "1112": { url: "https://avaserieshls.wns.live/hls", name: "Ava Series", logo: 'http://www.persianity.com/thumb.php?w=900&h=506&src=https://www.irtv.website/index_files/channels/avaseries.png', order: 1 },
  "1113": { url: "https://familyhls.avatv.live/hls", name: "Family TV", logo: 'https://cdn.vectorstock.com/i/500p/77/23/cute-family-media-channel-logo-template-digital-vector-42567723.jpg', order: 2 },
  "1114": { url: "https://voa-ingest.akamaized.net/hls/live/2033876/tvmc07", name: "VOA News", logo: 'https://gdb.voanews.com/01000000-0aff-0242-0f3b-08db0f7b7a54_cx0_cy3_cw0_w408_r1_s.png', order: 3 },
  "1115": { url: "https://hls.247box.live/hls", name: "247 Box", logo: 'https://cdn.myportfolio.com/5dff5785-d1c7-4ff5-bb0a-fca07c2b0453/c7e47864-2ad8-4892-b597-3f0adc63de84_rwc_0x0x2494x1667x2494.png?h=7096b8188eede6dc0a6477a988790096', order: 4 },
  "1116": { url: "https://cafefhls.wns.live/hls", name: "Cafe TV", logo: 'https://mir-s3-cdn-cf.behance.net/project_modules/1400/8f05fc103686335.6103c30009896.gif', order: 5 }
};

const COMMON_SUFFIXES = ["", "/index.m3u8", "/playlist.m3u8", "/stream.m3u8", "/master.m3u8", "/live.m3u8"];

// ============================================
// KV Functions
// ============================================
async function getChannels(env) {
  let channels = await env.CUSTOM_CHANNELS.get('channels');
  if (!channels) {
    channels = JSON.stringify(DEFAULT_CHANNELS);
    await env.CUSTOM_CHANNELS.put('channels', channels);
  }
  return JSON.parse(channels);
}

async function saveChannel(env, id, data) {
  let channels = await getChannels(env);
  if (!channels[id]) data.order = Object.keys(channels).length; 
  else data.order = channels[id].order; 
  
  channels[id] = data;
  await env.CUSTOM_CHANNELS.put('channels', JSON.stringify(channels));
}

async function deleteChannel(env, id) {
  let channels = await getChannels(env);
  delete channels[id];
  await env.CUSTOM_CHANNELS.put('channels', JSON.stringify(channels));
}

// ============================================
// 📺 UI Templates
// ============================================
const FAVICON_TAG = `<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📺</text></svg>">`;

function getChannelsListHTML(channelsJson) {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  ${FAVICON_TAG}
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>IPTV Manager</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; cursor: default; touch-action: manipulation; }
    .modal { display: none; position: fixed; z-index: 50; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.85); backdrop-filter: blur(8px); }
    .modal-content { background-color: #18181b; margin: 10% auto; padding: 24px; border: 1px solid #3f3f46; width: 90%; max-width: 500px; border-radius: 28px; }
    .sortable-ghost { opacity: 0.2; transform: scale(0.9); }
    .sortable-chosen { box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); border-color: #10b981 !important; }
    .sortable-drag { cursor: grabbing !important; opacity: 1 !important; z-index: 9999; }
    #saveStatus { opacity: 0; transition: opacity 0.3s; }
  </style>
</head>
<body class="bg-zinc-950 text-white select-none">
  <div class="max-w-6xl mx-auto p-4 md:p-8">
    <div class="flex justify-between items-center mb-10">
      <button id="addBtn" class="text-2xl w-12 h-12 flex items-center justify-center text-emerald-500 bg-zinc-900 rounded-full hover:bg-zinc-800 transition border border-zinc-800 shadow-xl">+</button>
      <div class="text-center">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">📡 IPTV PANEL</h1>
        <p class="text-zinc-500 text-xs mt-2">Hold card to reorder</p>
        <span id="saveStatus" class="text-xs text-emerald-400 font-bold mt-1 block">✔ Order Saved</span>
      </div>
      <button id="editListBtn" class="text-2xl w-12 h-12 flex items-center justify-center bg-zinc-900 rounded-full hover:bg-zinc-800 transition border border-zinc-800 shadow-xl">✏️</button>
    </div>
    
    <div id="channelsGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20"></div>
  </div>

  <div id="channelModal" class="modal">
    <div class="modal-content">
      <h2 id="modalTitle" class="text-2xl font-bold mb-6 text-center text-emerald-400"></h2>
      <form id="channelForm" class="space-y-4">
        <input type="hidden" id="editId">
        <div><label class="block text-xs text-zinc-500 mb-1">Channel ID</label><input id="channelId" type="text" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="e.g. 101" required></div>
        <div><label class="block text-xs text-zinc-500 mb-1">Name</label><input id="channelName" type="text" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="Channel Name" required></div>
        <div><label class="block text-xs text-zinc-500 mb-1">HLS URL</label><input id="channelUrl" type="url" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="https://..." required></div>
        <div><label class="block text-xs text-zinc-500 mb-1">Logo URL (Optional)</label><input id="channelLogo" type="url" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="https://..."></div>
        <div class="flex gap-2 pt-4"><button type="submit" class="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold">Save</button><button type="button" onclick="closeModal('channelModal')" class="flex-1 bg-zinc-800 py-3 rounded-xl font-bold">Cancel</button></div>
      </form>
    </div>
  </div>

  <div id="editListModal" class="modal"><div class="modal-content"><div class="flex justify-between items-center mb-6"><h2 class="text-xl font-bold">Manage List</h2><button onclick="closeModal('editListModal')" class="text-zinc-500 p-2">✕</button></div><div id="editList" class="space-y-2 max-h-96 overflow-y-auto pr-2"></div></div></div>

  <script>
    let channels = ${channelsJson};
    const grid = document.getElementById('channelsGrid');

    function getSortedChannels() {
      return Object.entries(channels).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    }

    function renderChannels() {
      grid.innerHTML = '';
      getSortedChannels().forEach(([id, ch]) => {
        const card = document.createElement('div');
        card.setAttribute('data-id', id);
        card.className = 'group relative bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-3xl p-4 md:p-6 transition-all text-center shadow-lg cursor-pointer md:cursor-grab';
        card.innerHTML = \`
          <a href="/\${id}" class="block w-full h-full">
            <div class="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 flex items-center justify-center bg-zinc-800 rounded-2xl overflow-hidden pointer-events-none">
              \${ch.logo ? '<img src="' + ch.logo + '" class="w-full h-full object-contain p-2">' : '<span class="text-3xl md:text-4xl">📺</span>'}
            </div>
            <div class="text-lg md:text-xl font-bold text-zinc-100 group-hover:text-white transition-colors truncate">\${ch.name}</div>
          </a>
        \`;
        grid.appendChild(card);
      });
    }

    new Sortable(grid, {
      animation: 250,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      forceFallback: true,
      delay: 200,
      delayOnTouchOnly: true,
      onEnd: async function (evt) {
        if (evt.oldIndex === evt.newIndex) return;
        const newOrder = Array.from(grid.querySelectorAll('[data-id]')).map(el => el.getAttribute('data-id'));
        try {
          await fetch('/reorder-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrder })
          });
          const statusEl = document.getElementById('saveStatus');
          statusEl.style.opacity = '1';
          setTimeout(() => { statusEl.style.opacity = '0'; }, 2000);
          newOrder.forEach((id, index) => { if(channels[id]) channels[id].order = index; });
        } catch(e) { console.error("Save Error"); }
      }
    });

    function openModal(mode, id = '') {
      const modal = document.getElementById('channelModal');
      document.getElementById('modalTitle').textContent = mode === 'add' ? 'Add Channel' : 'Edit Channel';
      document.getElementById('channelForm').reset();
      document.getElementById('editId').value = id;
      if (mode === 'edit') {
        const ch = channels[id];
        document.getElementById('channelId').value = id;
        document.getElementById('channelId').readOnly = true;
        document.getElementById('channelName').value = ch.name;
        document.getElementById('channelUrl').value = ch.url;
        document.getElementById('channelLogo').value = ch.logo || '';
      } else { document.getElementById('channelId').readOnly = false; }
      modal.style.display = 'block';
    }

    function openEditList() {
      const modal = document.getElementById('editListModal');
      const list = document.getElementById('editList');
      list.innerHTML = '';
      getSortedChannels().forEach(([id, ch]) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800 mb-2';
        div.innerHTML = \`<span class="text-zinc-200 truncate pr-2">\${ch.name}</span><div class="flex gap-3"><button onclick="editChannel('\${id}')" class="text-emerald-500 font-bold p-1">Edit</button><button onclick="removeChannel('\${id}')" class="text-red-500 font-bold p-1">Delete</button></div>\`;
        list.appendChild(div);
      });
      modal.style.display = 'block';
    }

    window.editChannel = (id) => { closeModal('editListModal'); openModal('edit', id); };
    window.removeChannel = async (id) => {
      if (confirm('Delete this channel?')) {
        await fetch('/delete-channel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        location.reload();
      }
    };
    window.closeModal = (id) => document.getElementById(id).style.display = 'none';

    document.getElementById('addBtn').onclick = () => openModal('add');
    document.getElementById('editListBtn').onclick = openEditList;

    document.getElementById('channelForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('channelId').value.trim(),
        name: document.getElementById('channelName').value.trim(),
        url: document.getElementById('channelUrl').value.trim(),
        logo: document.getElementById('channelLogo').value.trim()
      };
      await fetch('/save-channel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      location.reload();
    };

    renderChannels();
  </script>
</body>
</html>`;
}

function getPlayerHTML(channelId, ch) {
  const name = ch.name || 'Channel ' + channelId;
  const isSmil = ch.url.includes(".smil");
  const defaultSuffix = isSmil ? "/playlist.m3u8" : "/index.m3u8";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${FAVICON_TAG}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: #000; font-family: ui-sans-serif, system-ui; }</style>
</head>
<body class="text-white flex flex-col p-4 md:p-6 min-h-screen">
  <div class="max-w-5xl mx-auto w-full">
    <div class="flex justify-between items-center mb-6">
       <a href="/" class="text-zinc-400 hover:text-white transition p-2 -ml-2">← Back</a>
       <h1 class="text-lg md:text-xl font-bold">${name}</h1>
    </div>
    <div class="bg-zinc-900 rounded-3xl overflow-hidden aspect-video border border-zinc-800 shadow-2xl">
      <video id="video" class="w-full h-full" controls autoplay playsinline></video>
    </div>
    
    <div class="mt-6 bg-zinc-900/50 p-4 md:p-6 rounded-3xl border border-zinc-800/50">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-zinc-500 text-xs uppercase tracking-widest font-bold">Server Selection</h3>
        <div id="status" class="text-xs font-bold px-3 py-1 rounded-lg transition-all duration-300"></div>
      </div>
      <div id="suffixButtons" class="flex flex-wrap gap-2"></div>
    </div>
  </div>
  <script>
    let hls = null;
    const origin = window.location.origin;
    const channelId = "${channelId}";
    const suffixes = ${JSON.stringify(COMMON_SUFFIXES)};
    function play(sfx) {
      const url = origin + "/" + channelId + sfx;
      const video = document.getElementById("video");
      const status = document.getElementById("status");
      status.textContent = "● Loading...";
      status.className = "text-xs font-bold px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400";
      
      document.querySelectorAll('.sfx-btn').forEach(b => b.className = b.dataset.sfx === sfx ? "sfx-btn px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 shadow-md" : "sfx-btn px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800");
      if (hls) hls.destroy();
      if (Hls.isSupported()) {
        hls = new Hls(); hls.loadSource(url); hls.attachMedia(video);
        hls.on(Hls.Events.FRAG_BUFFERED, () => { 
            status.textContent = "✔ Playing Live"; 
            status.className = "text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400"; 
        });
        hls.on(Hls.Events.ERROR, (_, d) => { if(d.fatal) { status.textContent = "✖ Error"; status.className = "text-xs font-bold px-3 py-1 rounded-lg bg-red-500/10 text-red-400"; } });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) { video.src = url; video.play(); }
    }
    const container = document.getElementById("suffixButtons");
    suffixes.forEach(s => {
      const btn = document.createElement("button"); btn.dataset.sfx = s; btn.className = "sfx-btn px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800";
      btn.textContent = s === "" ? "Original" : s.replace('/', ''); btn.onclick = () => play(s); container.appendChild(btn);
    });
    window.onload = () => play("${defaultSuffix}");
  </script>
</body>
</html>`;
}

// ============================================
// 🌍 WORKER ENTRY
// ============================================
export default {
  async fetch(request, env) {
    try {
      const requestUrl = new URL(request.url);
      const pathParts = requestUrl.pathname.split("/").filter(Boolean);

      if (pathParts.length === 0) {
        const channels = await getChannels(env);
        return new Response(getChannelsListHTML(JSON.stringify(channels)), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      if (request.method === 'POST' && pathParts[0] === 'save-channel') {
        const data = await request.json();
        await saveChannel(env, data.id, { url: data.url, name: data.name, logo: data.logo });
        return new Response('OK');
      }

      if (request.method === 'POST' && pathParts[0] === 'delete-channel') {
        const data = await request.json();
        await deleteChannel(env, data.id);
        return new Response('OK');
      }

      if (request.method === 'POST' && pathParts[0] === 'reorder-channels') {
        const { order } = await request.json();
        let channels = await getChannels(env);
        order.forEach((id, index) => { if (channels[id]) channels[id].order = index; });
        await env.CUSTOM_CHANNELS.put('channels', JSON.stringify(channels));
        return new Response('Order Saved');
      }

      const channelId = pathParts[0];
      const channels = await getChannels(env);
      const ch = channels[channelId];
      if (!ch) return new Response("Not Found", { status: 404 });

      if (pathParts.length === 1 && (request.headers.get("Accept") || "").includes("text/html")) {
        return new Response(getPlayerHTML(channelId, ch), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      const base = ch.url;
      const restPath = pathParts.slice(1).join("/");
      const queryString = requestUrl.search || "";
      let targetUrl = restPath ? (base.endsWith("/") ? base + restPath + queryString : base + "/" + restPath + queryString) : (base.includes(".smil") ? base + "/playlist.m3u8" + queryString : base + "/index.m3u8" + queryString);

      if (restPath.startsWith("__proxy__/")) {
        const decodedUrl = decodeURIComponent(restPath.replace("__proxy__/", ""));
        const upRes = await fetch(decodedUrl, { headers: { "User-Agent": "Mozilla/5.0", "Referer": new URL(decodedUrl).origin + "/" } });
        return new Response(upRes.body, { headers: { "Content-Type": upRes.headers.get("content-type"), "Access-Control-Allow-Origin": "*" } });
      }

      const upRes = await fetch(targetUrl, { headers: { "User-Agent": "Mozilla/5.0", "Referer": new URL(targetUrl).origin + "/" } });
      if (!upRes.ok) return new Response("Error", { status: upRes.status });

      const cType = upRes.headers.get("content-type") || "";
      if (cType.includes("mpegurl") || targetUrl.endsWith(".m3u8")) {
        const finalBase = upRes.url.substring(0, upRes.url.lastIndexOf("/") + 1);
        let text = await upRes.text();
        const proxyBase = `${requestUrl.origin}/${channelId}`;
        text = text.replace(/^([^#][^\r\n]*)/gm, (line) => {
          if (!line.trim()) return line;
          const absUrl = new URL(line, finalBase).toString();
          const rel = absUrl.replace(base, "");
          return `${proxyBase}/${rel.startsWith("/") ? rel.substring(1) : rel}`;
        });
        return new Response(text, { headers: { "Content-Type": "application/vnd.apple.mpegurl", "Access-Control-Allow-Origin": "*" } });
      }
      return new Response(upRes.body, { headers: { "Content-Type": cType, "Access-Control-Allow-Origin": "*" } });

    } catch (err) { return new Response(err.message, { status: 500 }); }
  }
};
