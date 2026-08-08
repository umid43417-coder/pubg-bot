import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { bot, notifyBuy } from "./bot.js";
import { activeListings, findListing } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function checkInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");
    const dcs = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`).join("\n");
    const secret = crypto.createHmac("sha256", "WebAppData").update(TOKEN).digest();
    const calc = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
    if (calc !== hash) return null;
    return JSON.parse(params.get("user"));
  } catch {
    return null;
  }
}

app.get("/api/listings", (_req, res) => {
  res.json(
    activeListings().map((l) => ({
      ...l,
      media: l.media.map((m) => ({ type: m.type, url: `/api/file/${m.file_id}` })),
    }))
  );
});

app.get("/api/file/:fileId", async (req, res) => {
  try {
    const f = await bot.api.getFile(req.params.fileId);
    const r = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${f.file_path}`);
    if (!r.ok) return res.sendStatus(404);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Content-Type", r.headers.get("content-type") || "application/octet-stream");
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.sendStatus(404);
  }
});

app.post("/api/buy", async (req, res) => {
  const user = checkInitData(req.body.initData || "");
  if (!user) return res.status(401).json({ error: "auth" });
  const l = findListing(req.body.id);
  if (!l || l.status !== "active") return res.status(404).json({ error: "not found" });
  await notifyBuy(l, user);
  res.json({ ok: true });
});

app.get("/health", (_req, res) => res.send("ok"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("web on " + PORT));

bot.start({ drop_pending_updates: true, onStart: (i) => console.log("bot @" + i.username) });
