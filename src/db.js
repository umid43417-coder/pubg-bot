import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "db.json");

const empty = { listings: [], users: {}, seq: 1 };
let db = empty;

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function load() {
  ensure();
  try {
    if (fs.existsSync(FILE)) db = { ...empty, ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch (e) {
    console.error("db load error", e);
    db = { ...empty };
  }
  return db;
}

export function save() {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export function getDb() {
  return db;
}

export function nextId() {
  const id = db.seq++;
  save();
  return id;
}

export function addListing(listing) {
  db.listings.unshift(listing);
  save();
  return listing;
}

export function findListing(id) {
  return db.listings.find((l) => l.id === Number(id));
}

export function activeListings() {
  return db.listings.filter((l) => l.status === "active");
}

export function userListings(uid) {
  return db.listings.filter((l) => l.sellerId === uid);
}

load();
