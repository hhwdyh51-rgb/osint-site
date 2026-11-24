const PROXY_URL = "https://osint-proxy.hhwdyh51.workers.dev";
const WEBHOOK_URL = "https://webhook.site/383a9bc8-6ef2-4715-b6ae-091032d9d77d";

const mainAppEl = document.getElementById("mainApp");
const checkScreenEl = document.getElementById("checkScreen");
const checkStatusTextEl = document.getElementById("checkStatusText");

const inputEl = document.getElementById("queryInput");
const extraEl = document.getElementById("extraContextInput");
const btnEl = document.getElementById("runBtn");
const outputEl = document.getElementById("output");

const imgUrlInput = document.getElementById("imgUrlInput");
const imgUrlBtn = document.getElementById("imgUrlBtn");
const imgFileInput = document.getElementById("imgFileInput");

function switchTab(tabId, index) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));

  document.querySelectorAll(".tab-btn")[index].classList.add("active");
  document.getElementById(tabId).classList.add("active");
  outputEl.innerHTML = "";
}

function analyzePhone(raw) {
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\+/g, "");
  if (!/^\+?\d{7,15}$/.test(cleaned) || digitsOnly.length < 7) {
    return null;
  }

  let countryHint = "לא מזוהה (מומלץ להוסיף קידומת בינלאומית)";
  let e164 = cleaned.startsWith("+") ? cleaned : `+${digitsOnly}`;

  if (cleaned.startsWith("+972") || digitsOnly.startsWith("972")) {
    countryHint = "ישראל (+972)";
    e164 = `+${digitsOnly}`; } else if (/^05\d{8}$/.test(digitsOnly)) { countryHint = "ישראל — מספר נייד מקומי (05x)"; e164 = `+972${digitsOnly.slice(1)}`;
  } else if (/^0[23489]\d{7}$/.test(digitsOnly)) {
    countryHint = "ישראל — מספר נייח מקומי";
    e164 = `+972${digitsOnly.slice(1)}`; } else if (cleaned.startsWith("+1")) { countryHint = "ארה״ב / קנדה (+1)"; } else if (cleaned.startsWith("+44")) { countryHint = "בריטניה (+44)"; }  return { e164, length: digitsOnly.length, countryHint }; }  function looksLikeAddress(text) { return /\d/.test(text) \vert{}\vert{} /(רחוב\vert{}שד׳\vert{}שדרות\vert{}דרך\vert{}מס׳\vert{}מספר\vert{}עיר\vert{}street\vert{}st\.\vert{}ave\vert{}avenue\vert{}road\vert{}rd\.\vert{}blvd)/i.test(text); }  async function fetchJson(url) { const proxyTarget = `${PROXY_URL}?url=${encodeURIComponent(url)}`; const res = await fetch(proxyTarget); if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderPeopleAddressProfiles(rawQuery, extraContext) {
  const cleanHandle = rawQuery.replace(/^@+/, "").trim();
  const combined = extraContext ? `${rawQuery}${extraContext}`.trim() : rawQuery;
  const quotedMain = `"${rawQuery}"`; const quotedCombined = `"${combined}"`;
  const isAddr = looksLikeAddress(combined);

  const qMain = encodeURIComponent(quotedMain);
  const qComb = encodeURIComponent(quotedCombined);
  const qMaps = encodeURIComponent(combined);
  const qLinkedIn = encodeURIComponent(`${quotedCombined} site:linkedin.com/in`); const qFb = encodeURIComponent(`${quotedCombined} site:facebook.com`);
  const qIg = encodeURIComponent(`${quotedCombined} site:instagram.com`); const qX = encodeURIComponent(`${quotedCombined} (site:x.com OR site:twitter.com)`);
  const u = encodeURIComponent(cleanHandle);

  return `
    <div class="card">
      <h3>חיפוש שמות, כתובות ופרופילים</h3>
      <p><b>שאילתה:</b> ${combined}</p>
      <p class="note">סוג מזוהה: ${isAddr ? "כתובת / מיקום / פרט משולב" : "שם / פרופיל / מונח כללי"}</p>
      <div class="platform-grid">
        <a class="platform-link" href="https://www.google.com/search?q=${qComb}" target="_blank">גוגל (מדויק)</a>
        <a class="platform-link" href="https://www.bing.com/search?q=${qComb}" target="_blank">Bing (מדויק)</a>
        <a class="platform-link" href="https://www.google.com/search?q=${qLinkedIn}" target="_blank">פרופילי LinkedIn</a>
        <a class="platform-link" href="https://www.google.com/search?q=${qFb}" target="_blank">Facebook</a>
        <a class="platform-link" href="https://www.google.com/search?q=${qIg}" target="_blank">Instagram</a>
        <a class="platform-link" href="https://www.google.com/search?q=${qX}" target="_blank">X / Twitter</a>
        <a class="platform
