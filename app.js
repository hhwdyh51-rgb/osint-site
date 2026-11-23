const PROXY_URL = "https://osint-proxy.hhwdyh51.workers.dev";

const inputEl = document.getElementById("queryInput");
const btnEl = document.getElementById("runBtn");
const outputEl = document.getElementById("output");

const imgUrlInput = document.getElementById("imgUrlInput");
const imgUrlBtn = document.getElementById("imgUrlBtn");
const imgFileInput = document.getElementById("imgFileInput");

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (tabId === 'text-search') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
  }
  document.getElementById(tabId).classList.add('active');
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
    e164 = `+${digitsOnly}`;
  } else if (/^05\d{8}$/.test(digitsOnly)) {
    countryHint = "ישראל — מספר נייד מקומי (05x)";
    e164 = `+972${digitsOnly.slice(1)}`;
  } else if (/^0[23489]\d{7}$/.test(digitsOnly)) {
    countryHint = "ישראל — מספר נייח מקומי";
    e164 = `+972${digitsOnly.slice(1)}`;
  } else if (cleaned.startsWith("+1")) {
    countryHint = "ארה״ב / קנדה (+1)";
  } else if (cleaned.startsWith("+44")) {
    countryHint = "בריטניה (+44)";
  }

  return { e164, length: digitsOnly.length, countryHint };
}

async function fetchJson(url) {
  const proxyTarget = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyTarget);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderGlobalPlatforms(username) {
  const u = encodeURIComponent(username);
  const q = encodeURIComponent(`"${username}"`);
  
  return `
    <div class="card">
      <h3>סריקת שם משתמש בפלטפורמות ברחבי العالم</h3>
      <p>לחץ על הפלטפורמה לבדיקה ישירה של הפרופיל:</p>
      <div class="platform-grid">
        <a class="platform-link" href="https://github.com/${u}" target="_blank">GitHub</a>
        <a class="platform-link" href="https://gitlab.com/${u}" target="_blank">GitLab</a>
        <a class="platform-link" href="https://twitter.com/${u}" target="_blank">X (Twitter)</a>
        <a class="platform-link" href="https://www.instagram.com/${u}/" target="_blank">Instagram</a>
        <a class="platform-link" href="https://www.tiktok.com/@${u}" target="_blank">TikTok</a>
        <a class="platform-link" href="https://www.facebook.com/${u}" target="_blank">Facebook</a>
        <a class="platform-link" href="https://www.youtube.com/@${u}" target="_blank">YouTube</a>
        <a class="platform-link" href="https://t.me/${u}" target="_blank">Telegram</a>
        <a class="platform-link" href="https://www.reddit.com/user/${u}/" target="_blank">Reddit</a>
        <a class="platform-link" href="https://www.pinterest.com/${u}/" target="_blank">Pinterest</a>
        <a class="platform-link" href="https://medium.com/@${u}" target="_blank">Medium</a>
        <a class="platform-link" href="https://steamcommunity.com/id/${u}" target="_blank">Steam</a>
        <a class="platform-link" href="https://dev.to/${u}" target="_blank">DEV.to</a>
        <a class="platform-link" href="https://news.ycombinator.com/user?id=${u}" target="_blank">Hacker News</a>
        <a class="platform-link" href="https://www.google.com/search?q=${q}" target="_blank">גוגל (מופעים)</a>
        <a class="platform-link" href="https://www.bing.com/search?q=${q}" target="_blank">Bing (מופעים)</a>
      </div>
    </div>
  `;
}

function renderImageSearches(imageUrl) {
  const encodedUrl = encodeURIComponent(imageUrl);
  return `
    <div class="card">
      <h3>תצוגה מקדימה וחיפוש הפוך בעולם</h3>
      <img src="${imageUrl}" class="img-preview" alt="תצוגה מקדימה" onerror="this.style.display='none'" />
      <p style="margin-top: 12px;">מנועי חיפוש תמונות גלובליים:</p>
      <div class="platform-grid">
        <a class="platform-link" href="https://lens.google.com/uploadbyurl?url=${encodedUrl}" target="_blank">Google Lens</a>
        <a class="platform-link" href="https://yandex.com/images/search?rpt=imageview&url=${encodedUrl}" target="_blank">Yandex Images</a>
        <a class="platform-link" href="https://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=${encodedUrl}" target="_blank">Bing Visual</a>
        <a class="platform-link" href="https://tineye.com/search?url=${encodedUrl}" target="_blank">TinEye</a>
      </div>
    </div>
  `;
}

btnEl.addEventListener("click", async () => {
  const val = inputEl.value.trim();
  if (!val) {
    outputEl.innerHTML = `<div class="card">נא להזין ערך לבדיקה.</div>`;
    return;
  }

  outputEl.innerHTML = `<div class="card">מבצע בדיקה מקיפה בעולם עבור <b>${val}</b>...</div>`;
  let html = "";

  const phoneInfo = analyzePhone(val);
  const hasDot = val.includes(".");
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(val);
  const looksLikeUsername = !phoneInfo && !hasDot && /^[a-zA-Z0-9._-]{2,40}$/.test(val);

  if (phoneInfo) {
    const encodedPhone = encodeURIComponent(`"${val}"`);
    const encodedE164 = encodeURIComponent(`"${phoneInfo.e164}"`);
    html += `
      <div class="card">
        <h3>ניתוח מספר טלפון</h3>
        <p>פורמט בינלאומי משוער: <b>${phoneInfo.e164}</b></p>
        <p>ספרות: ${phoneInfo.length}</p>
        <p>אזור/קידומת: ${phoneInfo.countryHint}</p>
        <p>חיפוש מופעים במנועים:
          <a href="https://www.google.com/search?q=${encodedPhone}" target="_blank" style="color:#60a5fa">גוגל (מקורי)</a> |
          <a href="https://www.google.com/search?q=${encodedE164}" target="_blank" style="color:#60a5fa">גוגל (בינלאומי)</a>
        </p>
      </div>
    `;
  }

  if (looksLikeUsername) {
    html += renderGlobalPlatforms(val);

    try {
      const ghData = await fetchJson(`https://api.github.com/users/${encodeURIComponent(val)}`);
      if (ghData && ghData.login) {
        html += `
          <div class="card">
            <h3>פרופיל GitHub (אימות מהיר)</h3>
            <p>שם: ${ghData.name || "לא מוגדר"}</p>
            <p>ביו: ${ghData.bio || "לא מוגדר"}</p>
            <p>מאגרים ציבוריים: ${ghData.public_repos ?? "-"}</p>
            <p>קישור ישיר: <a href="${ghData.html_url}" target="_blank" style="color:#60a5fa">${ghData.html_url}</a></p>
          </div>
        `;
      }
    } catch {}
  }

  if (hasDot) {
    let resolvedIp = isIp ? val : null;

    if (!isIp) {
      try {
        const [dnsA, dnsMx, dnsTxt, dnsNs] = await Promise.all([
          fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(val)}&type=A`),
          fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(val)}&type=MX`),
          fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(val)}&type=TXT`),
          fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(val)}&type=NS`)
        ]);

        const ips = (dnsA.Answer || []).map((r) => r.data);
        const mxs = (dnsMx.Answer || []).map((r) => r.data);
        const txts = (dnsTxt.Answer || []).map((r) => r.data);
        const nss = (dnsNs.Answer || []).map((r) => r.data);

        if (ips.length > 0 && /^\d{1,3}(\.\d{1,3}){3}$/.test(ips[0])) {
          resolvedIp = ips[0];
        }

        const encodedDomain = encodeURIComponent(val);
        html += `
          <div class="card">
            <h3>ניתוח דומיין ורשומות DNS</h3>
            <p><b>A (IP):</b> ${ips.length ? ips.join(", ") : "אין"}</p>
            <p><b>MX (דואר):</b> ${mxs.length ? mxs.join(", ") : "אין"}</p>
            <p><b>NS (שרתי שם):</b> ${nss.length ? nss.join(", ") : "אין"}</p>
            <p><b>TXT (אימותים/SPF):</b> ${txts.length ? txts.join(" | ") : "אין"}</p>
            <p style="margin-top: 10px;">
              כלים נוספים:
              <a href="https://crt.sh/?q=${encodedDomain}" target="_blank" style="color:#60a5fa">תעודות SSL (crt.sh)</a> |
              <a href="https://web.archive.org/web/*/${encodedDomain}" target="_blank" style="color:#60a5fa">ארכיון (Wayback)</a>
            </p>
          </div>
        `;
      } catch {
        html += `<div class="card">DNS: שגיאה בשליפת רשומות הדומיין.</div>`;
      }
    }

    if (resolvedIp) {
      try {
        const ipData = await fetchJson(`https://ipwho.is/${encodeURIComponent(resolvedIp)}`);
        if (ipData.success) {
          html += `
            <div class="card">
              <h3>מיקום רשת (GeoIP) עבור ${resolvedIp}</h3>
              <p>מדינה: ${ipData.country || "-"} ${ipData.flag?.emoji || ""}</p>
              <p>עיר: ${ipData.city || "-"}</p>
              <p>ספק אינטרנט (ISP): ${ipData.connection?.isp || "-"}</p>
              <p>ארגון / ASN: ${ipData.connection?.org || "-"}</p>
            </div>
          `;
        }
      } catch {
        html += `<div class="card">GeoIP: שגיאה בשליפת פרטי IP.</div>`;
      }
    }
  }

  outputEl.innerHTML = html || `<div class="card">לא הוחזרו תוצאות. נסה להזין קלט אחר.</div>`;
});

imgUrlBtn.addEventListener("click", () => {
  const url = imgUrlInput.value.trim();
  if (!url) {
    outputEl.innerHTML = `<div class="card">נא להזין קישור תקין לתמונה.</div>`;
    return;
  }
  outputEl.innerHTML = renderImageSearches(url);
});

imgFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    outputEl.innerHTML = `
      <div class="card">
        <h3>קובץ תמונה מקומי</h3>
        <p>שם הקובץ: ${file.name}</p>
        <p>גודל: ${(file.size / 1024).toFixed(1)} KB</p>
        <p>סוג: ${file.type}</p>
        <img src="${dataUrl}" class="img-preview" alt="תצוגה מקדימה" />
        <p style="margin-top: 10px; color: #94a3b8;">
          * כדי לבצע חיפוש תמונות הפוך במנועים כמו Google Lens או Yandex, התמונה צריכה להיות מועלית לרשת (או להשתמש בקישור ישיר).
        </p>
      </div>
    `;
  };
  reader.readAsDataURL(file);
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnEl.click();
});
