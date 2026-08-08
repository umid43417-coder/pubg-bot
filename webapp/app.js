/* PUBG MARKET — Telegram Mini App klienti */
const tg = window.Telegram?.WebApp;
const INIT = tg?.initData || "";
let CURRENCY = "so'm";

const state = { sort: "new", hideSold: false, tab: "shop", items: [] };

const $ = (sel) => document.querySelector(sel);
const grid = $("#grid");

function money(v) {
  return new Intl.NumberFormat("ru-RU").format(v || 0) + " " + CURRENCY;
}
function photoUrl(fileId) {
  return `/api/photo/${encodeURIComponent(fileId)}`;
}
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function haptic(type = "light") {
  try { tg?.HapticFeedback?.impactOccurred(type); } catch (_) {}
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Init-Data": INIT, ...(options.headers || {}) },
  });
  if (!res.ok) {
    let detail = "Xatolik yuz berdi";
    try { detail = (await res.json()).detail || detail; } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

/* ---------------- Ro'yxat ---------------- */

function cardHtml(item) {
  const cover = item.photos?.[0]
    ? `<img loading="lazy" src="${photoUrl(item.photos[0])}" alt="${item.title}" />`
    : "";
  const sold = item.status === "sold" ? `<span class="tag sold">SOTILGAN</span>` : "";
  return `
    <article class="card" data-id="${item.id}">
      <div class="thumb">${cover}<span class="tag">LVL ${item.level || "—"}</span>${sold}</div>
      <div class="body">
        <p class="title">${escapeHtml(item.title)}</p>
        <div class="price">${money(item.price)}</div>
      </div>
    </article>`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function render(items) {
  state.items = items;
  grid.innerHTML = items.map(cardHtml).join("");
  $("#count").textContent = `${items.length} ta e'lon`;
  $("#empty").classList.toggle("hidden", items.length > 0);
  grid.querySelectorAll(".card").forEach((c) =>
    c.addEventListener("click", () => openDetails(Number(c.dataset.id)))
  );
}

async function load() {
  const params = new URLSearchParams({ sort: state.sort });
  const q = $("#q").value.trim();
  const minP = $("#minP").value;
  const maxP = $("#maxP").value;
  if (q) params.set("q", q);
  if (minP) params.set("min_price", minP);
  if (maxP) params.set("max_price", maxP);
  if (state.hideSold) params.set("hide_sold", "true");

  try {
    const data = state.tab === "my" ? await api("/api/my") : await api(`/api/listings?${params}`);
    render(data.items || []);
  } catch (e) {
    toast(e.message);
  }
}

/* ---------------- Batafsil ---------------- */

async function openDetails(id) {
  haptic();
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const gallery = (item.photos || []).map((p) => `<img src="${photoUrl(p)}" alt="" />`).join("");
  const sold = item.status === "sold";

  $("#sheetBody").innerHTML = `
    <h2 style="margin:4px 0 12px">${escapeHtml(item.title)}</h2>
    <div class="gallery">${gallery || '<div class="empty">Rasm yo\'q</div>'}</div>
    <div class="kv">
      <b>Narx</b><span style="color:var(--accent);font-weight:700">${money(item.price)}</span>
      <b>Daraja</b><span>LVL ${item.level || "—"}</span>
      <b>Holat</b><span>${sold ? "🔴 Sotilgan" : "🟢 Sotuvda"}</span>
      <b>ID</b><span>#${item.id}</span>
    </div>
    ${item.description ? `<p class="desc">${escapeHtml(item.description)}</p>` : ""}
    <p class="muted" style="margin-top:14px">🛡 To'lov admin nazorati ostida amalga oshiriladi. Adminsiz pul o'tkazmang.</p>
    <button class="btn primary block" id="buyBtn" ${sold ? "disabled" : ""} style="margin-top:12px">
      ${sold ? "Sotilgan" : "🤝 Sotib olish (admin orqali)"}
    </button>`;

  $("#sheet").classList.remove("hidden");
  const buy = $("#buyBtn");
  if (buy && !sold) buy.addEventListener("click", () => buyItem(item));
}

async function buyItem(item) {
  const confirmBuy = () => doBuy(item.id);
  if (tg?.showConfirm) {
    tg.showConfirm(`«${item.title}» — ${money(item.price)}. So'rov adminga yuborilsinmi?`, (ok) => ok && confirmBuy());
  } else if (confirm("So'rov adminga yuborilsinmi?")) {
    confirmBuy();
  }
}

async function doBuy(listingId) {
  const btn = $("#buyBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Yuborilmoqda..."; }
  try {
    await api("/api/buy", { method: "POST", body: JSON.stringify({ listing_id: listingId }) });
    haptic("medium");
    $("#sheet").classList.add("hidden");
    toast("✅ So'rov yuborildi! Admin tez orada bog'lanadi.");
    tg?.showPopup?.({ title: "Qabul qilindi", message: "Admin siz bilan Telegram orqali bog'lanadi.", buttons: [{ type: "ok" }] });
  } catch (e) {
    toast(e.message);
    if (btn) { btn.disabled = false; btn.textContent = "🤝 Sotib olish (admin orqali)"; }
  }
}

/* ---------------- UI hodisalari ---------------- */

$("#sheetClose").addEventListener("click", () => $("#sheet").classList.add("hidden"));
$("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") $("#sheet").classList.add("hidden"); });

document.querySelectorAll("#sorts .chip[data-sort]").forEach((chip) =>
  chip.addEventListener("click", () => {
    document.querySelectorAll("#sorts .chip[data-sort]").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    state.sort = chip.dataset.sort;
    load();
  })
);

$("#hideSold").addEventListener("click", (e) => {
  state.hideSold = !state.hideSold;
  e.target.classList.toggle("active", state.hideSold);
  load();
});

$("#reset").addEventListener("click", () => {
  $("#q").value = ""; $("#minP").value = ""; $("#maxP").value = "";
  state.hideSold = false; $("#hideSold").classList.remove("active");
  load();
});

let debounce;
["#q", "#minP", "#maxP"].forEach((sel) =>
  $(sel).addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(load, 350); })
);

function goSell() {
  tg?.showPopup?.({
    title: "E'lon joylash",
    message: "Rasm va video yuklash uchun botga qayting va «➕ Akkaunt sotish» tugmasini bosing.",
    buttons: [{ type: "ok" }],
  });
  tg?.close?.();
}
$("#sellBtn").addEventListener("click", goSell);

document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    const name = tab.dataset.tab;
    if (name === "sell") return goSell();
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.tab = name;
    $(".list-head h2").textContent = name === "my" ? "Mening e'lonlarim" : "Sotuvdagi akkauntlar";
    load();
  })
);

/* ---------------- Start ---------------- */

(async function init() {
  try {
    tg?.ready(); tg?.expand();
    tg?.setHeaderColor?.("#0a0e14");
    tg?.setBackgroundColor?.("#0a0e14");
    const u = tg?.initDataUnsafe?.user;
    if (u) $("#who").textContent = `👋 ${u.first_name || ""} ${u.username ? "@" + u.username : ""}`;
  } catch (_) {}
  try { CURRENCY = (await (await fetch("/api/config")).json()).currency || CURRENCY; } catch (_) {}
  load();
})();
