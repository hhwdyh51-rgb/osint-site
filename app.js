const PROXY_URL = "https://osint-proxy.hhwdyh51.workers.dev";

const inputEl = document.getElementById("queryInput");
const btnEl = document.getElementById("runBtn");
const outputEl = document.getElementById("output");

function analyzePhone(raw) {
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\+/g, "");
  if (!/^\+?\d{7,15}$/.test(cleaned) || digitsOnly.length < 7) {
    return null;
  }

  let countryHint = "לא מזוהה (הוסף קידומת בינלאומית כמו +972)";
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

  return {
    e164,
    length: digitsOnly.length,
    countryHint
  };
}

async function fetchJson(url) {
  const proxyTarget = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyTarget);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

btnEl.addEventListener("click", async () => {
  const val = inputEl.value.trim();
  if (!val) {
    outputEl.innerHTML = `<div class="card">נא להזין ערך לבדיקה.</div>`;
    return;
  }

  outputEl.innerHTML = `<div class="card">מבצע בדיקות עבור <b>${val}</b>...</div>`;
  let html = "";

  const phoneInfo = analyzePhone(val);
  if (phoneInfo) {
    const encodedPhone = encodeURIComponent(`"${val}"`);
    html += `
      <div class="card">
        <h3>ניתוח מספר טלפון (מבני)</h3>
        <p>פורמט בינלאומי משוער: ${phoneInfo.e164}</p>
        <p>מספר ספרות: ${phoneInfo.length}</p>
        <p>זיהוי אזור/קידומת: ${phoneInfo.countryHint}</p>
        <p>חיפוש מופעים ציבוריים: <a href="https://www.google.com/search?q=${encodedPhone}" target="_blank" style="color:#60a5fa">חפש בגוגל</a></p>
      </div>
    `;
  }

  if (!phoneInfo) {
    try {
      const ghData = await fetchJson(`https://api.github.com/users/${encodeURIComponent(val)}`);
      if (ghData && ghData.login) {
        html += `
          <div class="card">
            <h3>GitHub</h3>
            <p>שם: ${ghData.name || "לא מוגדר"}</p>
            <p>ביו: ${ghData.bio || "לא מוגדר"}</p>
            <p>קישור: <a href="${ghData.html_url}" target="_blank" style="color:#60a5fa">${ghData.html_url}</a></p>
          </div>
        `;
      } else {
        html += `<div class="card">GitHub: לא נמצא פרופיל תואם.</div>`;
      }
    } catch {
      html += `<div class="card">GitHub: לא נמצא פרופיל תואם.</div>`;
    }
  }

  if (val.includes(".")) {
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(val);

    if (!isIp) {
      try {
        const dnsData = await fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(val)}&type=A`);
        const ips = (dnsData.Answer || []).map((r) => r.data);
        html += `
          <div class="card">
            <h3>רשומות DNS (דומיין)</h3>
            <p>כתובות IP (A): ${ips.length ? ips.join(", ") : "לא נמצאו רשומות A"}</p>
          </div>
        `;
      } catch {
        html += `<div class="card">DNS: שגיאה בבדיקת הדומיין.</div>`;
      }
    }

    if (isIp) {
      try {
        const ipData = await fetchJson(`https://ipwho.is/${encodeURIComponent(val)}`);
        if (ipData.success) {
          html += `
            <div class="card">
              <h3>מיקום רשת (GeoIP)</h3>
              <p>מדינה: ${ipData.country || "-"}</p>
              <p>עיר: ${ipData.city || "-"}</p>
              <p>ספק: ${ipData.connection?.isp || "-"}</p>
            </div>
          `;
        }
      } catch {
        html += `<div class="card">GeoIP: שגיאה במשיכת מיקום.</div>`;
      }
    }
  }

  outputEl.innerHTML = html || `<div class="card">לא הוחזרו תוצאות.</div>`;
});
