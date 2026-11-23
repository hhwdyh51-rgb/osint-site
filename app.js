const PROXY_URL = "https://osint-proxy.hhwdyh51.workers.dev";

const inputEl = document.getElementById("queryInput");
const btnEl = document.getElementById("runBtn");
const outputEl = document.getElementById("output");

function analyzePhoneBasic(raw) {
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\+/g, "");
  if (!/^\+?\d{7,15}$/.test(cleaned) || digitsOnly.length < 7) {
    return null;
  }

  let countryHint = "לא מזוהה (הוסף קידומת כמו +972)";
  if (cleaned.startsWith("+972") || digitsOnly.startsWith("972")) {
    countryHint = "ישראל (+972)";
  } else if (cleaned.startsWith("+1")) {
    countryHint = "ארה״ב / קנדה (+1)";
  } else if (cleaned.startsWith("+44")) {
    countryHint = "בריטניה (+44)";
  }

  return {
    normalized: cleaned.startsWith("+") ? cleaned : `+${digitsOnly}`,
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
    outputEl.innerHTML = `<div class="card">נא להזין שם משתמש, דומיין, IP או מספר טלפון.</div>`;
    return;
  }

  outputEl.innerHTML = `<div class="card">מבצע בדיקה עבור <b>${val}</b>...</div>`;
  let html = "";

  const phoneInfo = analyzePhoneBasic(val);
  if (phoneInfo) {
    html += `
      <div class="card">
        <h3>ניתוח מספר טלפון (מבני)</h3>
        <p>פורמט מנוקה: ${phoneInfo.normalized}</p>
        <p>אורך ספרות: ${phoneInfo.length}</p>
        <p>זיהוי קידומת: ${phoneInfo.countryHint}</p>
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
        html += `<div class="card">GitHub: לא נמצא משתמש תואם.</div>`;
      }
    } catch {
      html += `<div class="card">GitHub: לא נמצא פרופיל או שאירעה שגיאת רשת.</div>`;
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
        html += `<div class="card">DNS: לא הצלחתי לבדוק את הדומיין.</div>`;
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
