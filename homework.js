// Tự động lấy bài tập về nhà từ bảng giao bài của lớp (Google Sheets).
// Mỗi tuần cô tạo một tab "Tuần N"; Tuần 1 bắt đầu thứ Hai 17/8/2026.
const HW = {
  sheetId: "1toaR38rq50zWISGFuwyh35TEM5zZB4RdZIX01bZo2Ag",
  sheetUrl: "https://docs.google.com/spreadsheets/d/1toaR38rq50zWISGFuwyh35TEM5zZB4RdZIX01bZo2Ag/edit?usp=sharing",
  week1: new Date(2026, 7, 17),
};

const HW_SUBJECTS = {
  "english": "ta", "tiếng anh": "ta",
  "tiếng việt": "tv",
  "toán": "toan",
};

let hwDays = [];       // [{ key: "2026-10-12", label: "Thứ Hai", date: Date, subjects: [{ name, subject, tasks, comment }] }]
let hwSelected = null;

function hwKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function hwToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

// Tải một tab bằng JSONP (Google Sheets không cho fetch trực tiếp từ trang khác).
function hwLoadSheet(name) {
  return new Promise((resolve) => {
    const cb = "hwCb" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const done = (data) => { clearTimeout(timer); delete window[cb]; s.remove(); resolve(data); };
    const timer = setTimeout(() => done(null), 10000);
    window[cb] = (res) => done(res && res.status === "ok" ? res.table : null);
    s.onerror = () => done(null);
    s.src = `https://docs.google.com/spreadsheets/d/${HW.sheetId}/gviz/tq?tqx=out:json;responseHandler:${cb}&sheet=${encodeURIComponent(name)}&_=${Date.now()}`;
    document.head.appendChild(s);
  });
}

function hwParseDate(text, today) {
  const m = /\((\d{1,2})\/(\d{1,2})\)/.exec(text || "");
  if (!m) return null;
  const day = +m[1], month = +m[2] - 1;
  let year = today.getFullYear();
  if (month - today.getMonth() > 6) year--;
  if (today.getMonth() - month > 6) year++;
  return new Date(year, month, day);
}

// Mỗi dòng là một việc. Dòng chỉ có link được gắn vào việc ngay phía trên
// (VD: "Ôn tập kiến thức qua link game:" rồi 3 dòng link → 1 việc có 3 link).
function hwSplitTasks(text) {
  const tasks = [];
  for (let line of String(text || "").split("\n")) {
    line = line.replace(/^\s*[-–•*+]\s*/, "").trim();
    if (!line) continue;
    const urls = line.match(/https?:\/\/\S+/g) || [];
    const rest = urls.reduce((t, u) => t.replace(u, ""), line).trim();
    if (!rest && tasks.length) tasks[tasks.length - 1].urls.push(...urls);
    else tasks.push({ text: rest || "Làm bài trong link", urls });
  }
  return tasks;
}

function hwParseTable(table, today) {
  const days = [];
  let current = null;
  for (const row of table.rows || []) {
    const cell = (i) => String(row.c?.[i]?.v ?? "").trim();
    const date = hwParseDate(cell(0), today);
    if (date) {
      current = { key: hwKey(date), label: cell(0).replace(/\(.*\)/s, "").replace(/\s+/g, " ").trim(), date, subjects: [] };
      current.label = current.label.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
      days.push(current);
    }
    const name = cell(1);
    if (!current || !name || name === "/") continue;
    const tasks = hwSplitTasks([cell(2), cell(3)].filter(Boolean).join("\n"));
    const comment = [cell(4), cell(5)].filter(Boolean).join("\n");
    current.subjects.push({ name, subject: HW_SUBJECTS[name.toLowerCase()] || "khac", tasks, comment });
  }
  return days;
}

async function hwLoad(keepSelected) {
  const today = hwToday();
  const week = Math.floor((today - HW.week1) / (7 * 86400000)) + 1;
  // Lấy cả tuần trước và tuần sau phòng khi cô đánh số tuần lệch (nghỉ lễ…).
  const names = [week - 1, week, week + 1].filter(n => n >= 1).map(n => `Tuần ${n}`);
  const tables = await Promise.all(names.map(hwLoadSheet));
  if (tables.every(t => !t)) throw new Error("load");

  const byKey = new Map();
  for (const t of tables) if (t) for (const d of hwParseTable(t, today)) byKey.set(d.key, d);
  hwDays = [...byKey.values()].sort((a, b) => a.date - b.date);

  // Chọn hôm nay, nếu không có (cuối tuần) thì chọn ngày gần nhất trước đó.
  const past = hwDays.filter(d => d.date <= today);
  if (keepSelected && hwDays.some(d => d.key === keepSelected)) hwSelected = keepSelected;
  else hwSelected = (past[past.length - 1] || hwDays[0])?.key ?? null;
}

// ---------- Đánh dấu đã làm (lưu trên máy này) ----------
const HW_DONE_KEY = "thao-ngan-hw-done-v1";
function hwDoneLoad() {
  try { return JSON.parse(localStorage.getItem(HW_DONE_KEY)) || {}; } catch { return {}; }
}
function hwDoneSave(map) {
  // Chỉ giữ 60 ngày gần nhất
  const cutoff = hwKey(new Date(Date.now() - 60 * 86400000));
  for (const k of Object.keys(map)) if (k.slice(0, 10) < cutoff) delete map[k];
  try { localStorage.setItem(HW_DONE_KEY, JSON.stringify(map)); } catch {}
}
let hwDone = hwDoneLoad();
const hwTaskId = (day, subj, t) => `${day.key}|${subj.name}|${t.text}`;

// ---------- Hiển thị ----------
function hwRender() {
  const box = $("hwBody");
  const day = hwDays.find(d => d.key === hwSelected);
  const todayKey = hwKey(hwToday());

  // Thanh chọn ngày: chỉ hiện các ngày của tuần đang chọn
  const weekOf = (d) => hwKey(new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate() - ((d.date.getDay() + 6) % 7)));
  const week = day ? hwDays.filter(d => weekOf(d) === weekOf(day)) : [];
  $("hwDays").innerHTML = week.map(d => {
    const n = d.subjects.reduce((s, x) => s + x.tasks.length, 0);
    const left = d.subjects.reduce((s, x) => s + x.tasks.filter(t => !hwDone[hwTaskId(d, x, t)]).length, 0);
    const mark = n === 0 ? "" : left === 0 ? " ✅" : ` <small>${n - left}/${n}</small>`;
    return `<button class="chip ${d.key === hwSelected ? "active" : ""}" data-day="${d.key}">${d.key === todayKey ? "Hôm nay" : esc(d.label)}${mark}</button>`;
  }).join("");

  if (!day) {
    box.innerHTML = `<p class="hw-empty">Chưa có bài tập trong bảng giao bài.</p>`;
    $("hwProgress").hidden = true;
    return;
  }

  const subjects = day.subjects.filter(s => s.tasks.length || s.comment);
  const all = subjects.flatMap(s => s.tasks.map(t => hwTaskId(day, s, t)));
  const doneCount = all.filter(id => hwDone[id]).length;

  $("hwDate").textContent = `${day.label}, ${day.date.getDate()}/${day.date.getMonth() + 1}` + (day.key === todayKey ? " (hôm nay)" : "");
  $("hwProgress").hidden = all.length === 0;
  $("hwBar").style.width = all.length ? `${(doneCount / all.length) * 100}%` : "0";
  $("hwCount").textContent = doneCount === all.length && all.length
    ? `Xong hết ${all.length}/${all.length} bài rồi! Giỏi quá 🎉`
    : `Đã xong ${doneCount}/${all.length} bài`;

  if (all.length === 0) {
    box.innerHTML = `<p class="hw-empty">🎈 Ngày này cô chưa giao bài tập về nhà.</p>`;
    return;
  }

  box.innerHTML = subjects.map(s => {
    const subj = SUBJECTS[s.subject] || SUBJECTS.khac;
    return `<div class="hw-subject" style="--c:${subj.color};--cbg:${subj.bg}">
      <div class="hw-subject-head"><span class="tag">${subj.emoji} ${esc(s.name)}</span></div>
      ${s.tasks.map(t => {
        const id = hwTaskId(day, s, t);
        const checked = !!hwDone[id];
        return `<label class="hw-task ${checked ? "done" : ""}">
          <input type="checkbox" data-task="${esc(id)}" ${checked ? "checked" : ""}>
          <span class="box" aria-hidden="true"></span>
          <span class="txt">${esc(t.text)}${t.urls.map((u, i) => ` <a href="${esc(u)}" target="_blank" rel="noopener">${t.urls.length > 1 ? `Link ${i + 1}` : "Mở link"} ↗</a>`).join("")}</span>
        </label>`;
      }).join("")}
      ${s.comment ? `<p class="hw-comment">💬 Cô nhắn: ${esc(s.comment)}</p>` : ""}
    </div>`;
  }).join("");
}

$("hwBody").addEventListener("change", (e) => {
  const id = e.target.dataset.task;
  if (!id) return;
  if (e.target.checked) hwDone[id] = true; else delete hwDone[id];
  hwDoneSave(hwDone);
  hwRender();
});
$("hwDays").addEventListener("click", (e) => {
  const b = e.target.closest("[data-day]");
  if (b) { hwSelected = b.dataset.day; hwRender(); }
});
$("hwSheet").href = HW.sheetUrl;

function hwStatus(text) { $("hwStatus").textContent = text; }

async function hwRefresh() {
  const btn = $("hwRefresh");
  const hadData = hwDays.length > 0;
  btn.disabled = true;
  btn.textContent = "⏳ Đang cập nhật…";
  try {
    await hwLoad(hwSelected);
    hwRender();
    hwStatus(`Cập nhật lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`);
  } catch {
    if (hadData) hwStatus("Chưa cập nhật được, kiểm tra mạng rồi bấm Cập nhật lại");
    else $("hwBody").innerHTML = `<p class="hw-empty">Không tải được bảng giao bài. Kiểm tra mạng rồi bấm <b>Cập nhật</b>, hoặc mở <a href="${esc(HW.sheetUrl)}" target="_blank" rel="noopener">bảng giao bài</a>.</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "🔄 Cập nhật";
  }
}

$("hwRefresh").onclick = hwRefresh;
hwRefresh();
