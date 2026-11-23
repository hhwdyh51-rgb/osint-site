const PROXY_URL = "https://osint-proxy.hhwdyh51.workers.dev";

const inputEl = document.getElementById("queryInput");
const extraEl = document.getElementById("extraContextInput");
const btnEl = document.getElementById("runBtn");
const outputEl = document.getElementById("output");

const imgUrlInput = document.getElementById("imgUrlInput");
const imgUrlBtn = document.getElementById("imgUrlBtn");
const imgFileInput = document.getElementById("imgFileInput");

const myLocBtn = document.getElementById("myLocationBtn");
const myLocOut = document.getElementById("myLocationOutput");

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

function looksLikeAddress(text) {
  return /\d/.test(text) || /(רחוב|שד׳|שדרות|דרך|מס׳|מספר|עיר|street|st\.|ave|avenue|road|rd\.|blvd)/i.test(text);
}

async function fetchJson(url) {
  const proxyTarget = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyTarget);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderPeopleAddressProfiles(rawQuery, extraContext) {
  const cleanHandle = rawQuery.replace(/^@+/, "").trim();
  const combined = extraContext ? `${rawQuery} ${extraContext}`.trim() : rawQuery;
  const quotedMain = `"${rawQuery}"`;
  const quotedCombined = `"${combined}"`;
  const isAddr = looksLikeAddress(combined);

  const qMain = encodeURIComponent(quotedMain);
  const qComb = encodeURIComponent(quotedCombined);
  const qMaps = encodeURIComponent(combined);
  const qLinkedIn = encodeURIComponent(`${quotedCombined} site:linkedin.com/in`);
  const qFb = encodeURIComponent(`${quotedCombined} site:facebook.com`);
  const qIg = encodeURIComponent(`${quotedCombined} site:instagram.com`);
  const qX = encodeURIComponent(`${quotedCombined} (site:x.com OR site:twitter.com)`);
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
        <a class="platform-link" href="https://www.google.com/maps/search/?api=1&query=${qMaps}" target="_blank">Google Maps</a>
        <a class="platform-link" href="https://www.openstreetmap.org/search?query=${qMaps}" target="_blank">OpenStreetMap</a>
        <a class="platform-link" href="https://www.reddit.com/search/?q=${qMain}" target="_blank">Reddit</a>
        <a class="platform-link" href="https://github.com/${u}" target="_blank">GitHub (@${cleanHandle})</a>
        <a class="platform-link" href="https://t.me/${u}" target="_blank">Telegram (@${cleanHandle})</a>
        <a class="platform-link" href="https://www.youtube.com/@${u}" target="_blank">YouTube (@${cleanHandle})</a>
      </div>
    </div>
  `;
}

function renderImageHub(imageUrl = "", fileMeta = null) {
  const safeUrl = imageUrl.trim();
  const previewBlock = fileMeta
    ? `
      <p><b>קובץ:</b> ${fileMeta.name}</p>
      <p><b>גודל:</b> ${(fileMeta.size / 1024).toFixed(1)} KB | <b>סוג:</b> ${fileMeta.type || "לא ידוע"}</p>
      <img src="${fileMeta.dataUrl}" class="img-preview" alt="תצוגה מקדימה" />
    `
    : safeUrl
      ? `
        <p><b>כתובת תמונה:</b> ${safeUrl}</p>
        <img src="${safeUrl}" class="img-preview" alt="תצוגה מקדימה" onerror="this.style.display='none'" />
      `
      : "";

  return `
    <div class="card">
      <h3>כלי חיפוש תמונות (Reverse Image Search)</h3>
      ${previewBlock}
      <p style="margin-top: 12px;">פתח את המנועים והדבק/העלה את התמונה ישירות:</p>
      <div class="platform-grid">
        <a class="platform-link" href="https://lens.google.com/" target="_blank">Google Lens</a>
        <a class="platform-link" href="https://images.google.com/" target="_blank">Google Images</a>
        <a class="platform-link" href="https://yandex.com/images/" target="_blank">Yandex Images</a>
        <a class="platform-link" href="https://www.bing.com/visualsearch" target="_blank">Bing Visual Search</a>
        <a class="platform-link" href="https://tineye.com/" target="_blank">TinEye</a>
      </div>
    </div>
  `;
}

btnEl.addEventListener("click", async () => {
  const val = inputEl.value.trim();
  const extra = extraEl.value.trim();
  if (!val) {
    outputEl.innerHTML = `<div class="card">נא להזין ערך לבדיקה.</div>`;
    return;
  }

  outputEl.innerHTML = `<div class="card">מבצע בדיקה עבור <b>${val}</b>...</div>`;
  let html = "";

  const phoneInfo = analyzePhone(val);
  const hasDot = val.includes(".");
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(val);
  const hasSpacesOrNonHandle = /\s/.test(val) || /[^\x00-\x7F]/.test(val) || val.startsWith("@");
  const looksLikeUsername = !phoneInfo && !hasDot && !hasSpacesOrNonHandle && /^[a-zA-Z0-9._-]{2,40}$/.test(val);

  if (phoneInfo) {
    const qOrig = encodeURIComponent(`"${val}"`);
    const qE164 = encodeURIComponent(`"${phoneInfo.e164}"`);
    html += `
      <div class="card">
        <h3>ניתוח מספר טלפון</h3>
        <p>פורמט בינלאומי משוער: <b>${phoneInfo.e164}</b></p>
        <p>מספר ספרות: ${phoneInfo.length}</p>
        <p>אזור/קידומת: ${phoneInfo.countryHint}</p>
        <p>חיפוש מופעים:
          <a href="https://www.google.com/search?q=${qOrig}" target="_blank" style="color:#60a5fa">המספר המקורי</a> |
          <a href="https://www.google.com/search?q=${qE164}" target="_blank" style="color:#60a5fa">פורמט בינלאומי</a>
        </p>
      </div>
    `;
  }

  if (!phoneInfo && !isIp && (hasSpacesOrNonHandle || extra)) {
    html += renderPeopleAddressProfiles(val, extra);
  }

  if (looksLikeUsername) {
    html += renderPeopleAddressProfiles(val, extra);

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

  outputEl.innerHTML = html || `<div class="card">לא הוחזרו תוצאות. נסה להזין ערך אחר.</div>`;
});

imgUrlBtn.addEventListener("click", () => {
  const url = imgUrlInput.value.trim();
  outputEl.innerHTML = renderImageHub(url, null);
});

imgFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    outputEl.innerHTML = renderImageHub("", {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: evt.target.result
    });
  };
  reader.readAsDataURL(file);
});

if (myLocBtn && myLocOut) {
  myLocBtn.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      myLocOut.innerHTML = `<div class="card">הדפדפן הזה לא תומך בשירותי מיקום.</div>`;
      return;
    }

    myLocOut.innerHTML = `<div class="card">ממתין לאישור המיקום בדפדפן...</div>`;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const lat = latitude.toFixed(6);
        const lon = longitude.toFixed(6);
        const acc = Math.round(accuracy);
        const gMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
        const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;

        myLocOut.innerHTML = `
          <div class="card">
            <h3>המיקום שאושר בדפדפן</h3>
            <p><b>קואורדינטות:</b> ${lat}, ${lon}</p>
            <p><b>דיוק משוער:</b> כ-${acc} מטרים</p>
            <p>
              <a href="${gMapsUrl}" target="_blank" style="color:#60a5fa">פתח ב-Google Maps</a> |
              <a href="${osmUrl}" target="_blank" style="color:#60a5fa">פתח ב-OpenStreetMap</a>
            </p>
          </div>
        `;
      },
      (err) => {
        let msg = "לא ניתן לקבל מיקום.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "הגישה למיקום נדחתה (או נחסמה בהגדרות הדפדפן/המכשיר).";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "מידע המיקום אינו זמין כרגע.";
        } else if (err.code === err.TIMEOUT) {
          msg = "חלף הזמן המוקצב לקבלת המיקום.";
        }
        myLocOut.innerHTML = `<div class="card">${msg}</div>`;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnEl.click();
});
