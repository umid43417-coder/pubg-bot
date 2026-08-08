const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); try { tg.setHeaderColor("#07090d"); tg.setBackgroundColor("#07090d"); } catch (e) {} }

// ---- jonli fon: qurollar, kaska, granata, skinlar ----
const ICONS = ["🔫","🎯","💥","🪖","🧨","🎒","🪂","🥇","⚔️","🛡","💣","🚁"];
const fx = document.getElementById("fx");
for (let i = 0; i < 18; i++) {
  const s = document.createElement("span");
  s.textContent = ICONS[i % ICONS.length];
  s.style.left = Math.random() * 100 + "vw";
  s.style.fontSize = 16 + Math.random() * 22 + "px";
  s.style.animationDuration = 12 + Math.random() * 18 + "s";
  s.style.animationDelay = -Math.random() * 20 + "s";
  fx.appendChild(s);
}
// uchib o'tadigan AK-47
[0, 6, 12].forEach((d, i) => {
  const g = document.createElement("div");
  g.className = "gun";
  g.textContent = "🔫";
  g.style.top = 18 + i * 26 + "vh";
  g.style.animationDelay = -d + "s";
  g.style.animationDuration = 12 + i * 4 + "s";
  document.body.appendChild(g);
});

let all = [];
const grid = document.getElementById("grid");
const num = (v) => Number(String(v || "").replace(/[^\d]/g, "")) || 0;

async function load() {
  const r = await fetch("/api/listings");
  all = await r.json();
  document.getElementById("cnt").textContent = all.length;
  render();
}

function render() {
  const q = document.getElementById("q").value.toLowerCase();
  const sort = document.getElementById("sort").value;
  let list = all.filter((l) => JSON.stringify(l).toLowerCase().includes(q));
  if (sort === "cheap") list.sort((a, b) => num(a.price) - num(b.price));
  if (sort === "rich") list.sort((a, b) => num(b.price) - num(a.price));
  if (sort === "lvl") list.sort((a, b) => num(b.lvl) - num(a.lvl));
  if (sort === "new") list.sort((a, b) => b.createdAt - a.createdAt);

  document.getElementById("empty").hidden = list.length > 0;
  grid.innerHTML = list.map((l, i) => {
    const m = l.media[0];
    const thumb = !m ? "🎮"
      : m.type === "photo" ? `<img src="${m.url}" loading="lazy" alt="PUBG akkaunt">`
      : `<video src="${m.url}" muted playsinline preload="metadata"></video>`;
    return `<article class="card" style="animation-delay:${i * 45}ms" data-id="${l.id}">
      <div class="thumb">${thumb}
        <span class="badge">LVL ${l.lvl}</span>
        ${l.media.some((x) => x.type === "video") ? '<span class="vid">🎬</span>' : ""}
      </div>
      <div class="cbody">
        <div class="price">💰 ${l.price}</div>
        <div class="meta">🦹‍♂️ ${l.kiyim} · 🔫 ${l.avto}<br>🔱 ${l.dost} · ⚡️ ${l.prokachka}</div>
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".card").forEach((c) =>
    c.addEventListener("click", () => open(Number(c.dataset.id)))
  );
}

const modal = document.getElementById("modal");
let current = null;

function open(id) {
  const l = all.find((x) => x.id === id);
  if (!l) return;
  current = l;
  tg?.HapticFeedback?.impactOccurred("medium");
  document.getElementById("media").innerHTML = l.media.map((m) =>
    m.type === "photo"
      ? `<img src="${m.url}" alt="PUBG akkaunt rasmi">`
      : `<video src="${m.url}" controls playsinline></video>`
  ).join("") || "<div style='padding:20px'>🎮</div>";
  const rows = [
    ["📈 LVL", l.lvl], ["🛎 RP", l.rp], ["🦹‍♂️ Kiymlar", l.kiyim],
    ["🔫 Avtomatga skin", l.avto], ["🎈 Parashutga skin", l.parashut],
    ["🎒 Papkaga skin", l.papka], ["🔱 Dostijeniya", l.dost],
    ["⚜️ Titullar", l.titul], ["⚡️ Prokachka", l.prokachka],
    ["➡️ Kill chat", l.killchat], ["🔥 Qo'shimcha", l.extra],
  ];
  document.getElementById("detail").innerHTML =
    `<h2 class="dt">🎮 AKKAUNT #${l.id}</h2>` +
    `<div class="big">💰 ${l.price}</div>` +
    `<div class="rows">${rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join("")}</div>` +
    `<div class="row" style="margin-bottom:12px"><span>👤 Sotuvchi</span><b>${l.sellerUsername ? "@" + l.sellerUsername : l.sellerName}</b></div>`;
  modal.hidden = false;
}

document.getElementById("close").onclick = () => { modal.hidden = true; };
modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });
document.getElementById("q").addEventListener("input", render);
document.getElementById("sort").addEventListener("change", render);

document.getElementById("buy").onclick = async () => {
  if (!current) return;
  tg?.HapticFeedback?.notificationOccurred("success");
  const r = await fetch("/api/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: current.id, initData: tg?.initData || "" }),
  });
  if (r.ok) {
    tg?.showAlert?.("✅ So'rov adminga yuborildi! Admin (garant) siz bilan bog'lanadi.");
    modal.hidden = true;
  } else {
    tg?.showAlert?.("❌ Xatolik. Botni /start qiling va qayta urinib ko'ring.");
  }
};

load();
setInterval(load, 30000);
