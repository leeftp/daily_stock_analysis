"use strict";

const STORAGE_KEY = "health-tracker.entries.v1";

/** @typedef {{date:string, weight:?number, water:?number, steps:?number, sleep:?number, mood:string}} Entry */

/** @returns {Entry[]} */
function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to load entries", err);
    return [];
  }
}

/** @param {Entry[]} entries */
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function num(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

/** Upsert by date so re-saving the same day overwrites. */
function upsert(entries, entry) {
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

function avg(values) {
  const nums = values.filter((v) => v !== null && v !== undefined);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(value, digits = 1) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(digits);
}

function recent(entries, days) {
  return entries.slice(-days);
}

function renderSummary(entries) {
  const el = document.getElementById("summary");
  const last7 = recent(entries, 7);
  if (!last7.length) {
    el.innerHTML = '<p class="empty">まだ記録がありません。</p>';
    return;
  }
  const items = [
    { label: "平均体重 (kg)", value: fmt(avg(last7.map((e) => e.weight)), 1) },
    { label: "平均水分 (杯)", value: fmt(avg(last7.map((e) => e.water)), 1) },
    { label: "平均歩数", value: fmtInt(avg(last7.map((e) => e.steps))) },
    { label: "平均睡眠 (h)", value: fmt(avg(last7.map((e) => e.sleep)), 1) },
  ];
  el.innerHTML = items
    .map(
      (i) =>
        `<div class="summary-item"><div class="value">${i.value}</div><div class="label">${i.label}</div></div>`
    )
    .join("");
}

function fmtInt(value) {
  if (value === null || value === undefined) return "—";
  return Math.round(value).toLocaleString();
}

function renderChart(entries) {
  const el = document.getElementById("chart");
  const last = recent(entries, 14).filter((e) => e.weight !== null && e.weight !== undefined);
  if (!last.length) {
    el.innerHTML = '<p class="empty">体重データがありません。</p>';
    return;
  }
  const weights = last.map((e) => e.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  el.innerHTML = last
    .map((e) => {
      const pct = 20 + ((e.weight - min) / range) * 80; // 20%~100%
      const day = e.date.slice(5);
      return `<div class="bar-wrap" title="${e.date}: ${e.weight}kg">
        <span class="bar-val">${fmt(e.weight, 1)}</span>
        <div class="bar" style="height:${pct}%"></div>
        <span class="bar-day">${day}</span>
      </div>`;
    })
    .join("");
}

function renderHistory(entries) {
  const el = document.getElementById("history");
  if (!entries.length) {
    el.innerHTML = '<p class="empty">まだ記録がありません。</p>';
    return;
  }
  const rows = [...entries]
    .reverse()
    .map(
      (e) => `<tr>
        <td>${e.date}</td>
        <td>${fmt(e.weight, 1)}</td>
        <td>${e.water ?? "—"}</td>
        <td>${e.steps != null ? Number(e.steps).toLocaleString() : "—"}</td>
        <td>${fmt(e.sleep, 1)}</td>
        <td>${e.mood || "—"}</td>
        <td><button class="row-del" data-date="${e.date}" title="削除">✕</button></td>
      </tr>`
    )
    .join("");
  el.innerHTML = `<div class="table-scroll"><table>
    <thead><tr><th>日付</th><th>体重</th><th>水分</th><th>歩数</th><th>睡眠</th><th>気分</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;

  el.querySelectorAll(".row-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const date = btn.getAttribute("data-date");
      let entries = loadEntries().filter((e) => e.date !== date);
      saveEntries(entries);
      renderAll(entries);
    });
  });
}

function renderAll(entries) {
  renderSummary(entries);
  renderChart(entries);
  renderHistory(entries);
}

function exportJson(entries) {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `health-tracker-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  const form = document.getElementById("entry-form");
  const dateInput = document.getElementById("date");
  dateInput.value = todayStr();

  let entries = loadEntries();
  renderAll(entries);

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const entry = {
      date: dateInput.value || todayStr(),
      weight: num(document.getElementById("weight").value),
      water: num(document.getElementById("water").value),
      steps: num(document.getElementById("steps").value),
      sleep: num(document.getElementById("sleep").value),
      mood: document.getElementById("mood").value,
    };
    entries = upsert(loadEntries(), entry);
    saveEntries(entries);
    renderAll(entries);
    form.reset();
    dateInput.value = todayStr();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    exportJson(loadEntries());
  });

  document.getElementById("clear-btn").addEventListener("click", () => {
    if (confirm("すべての記録を削除しますか？この操作は取り消せません。")) {
      saveEntries([]);
      renderAll([]);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
