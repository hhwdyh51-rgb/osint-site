const inputEl = document.getElementById("queryInput");
const btnEl = document.getElementById("runBtn");
const outputEl = document.getElementById("output");

btnEl.addEventListener("click", async () => {
  const val = inputEl.value.trim();
  if (!val) {
    outputEl.innerHTML = `<div class="card">נא להזין ערך לבדיקה.</div>`;
    return;
  }

  outputEl.innerHTML = `<div class="card">בודק עבור <b>${val}</b>...</div>`;
  let html = "";

  // בדיקת פרופיל GitHub ציבורי
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(val)}`);
    if (res.ok) {
      const data = await res.json();
      html += `
        <div class="card">
          <h3>GitHub</h3>
          <p>שם: ${data.name || "לא מוגדר"}</p>
          <p>ביו: ${data.bio || "לא מוגדר"}</p>
          <p>קישור: <a href="${data.html_url}" target="_blank" style="color:#60a5fa">${data.html_url}</a></p>
        </div>
      `;
    } else {
      html += `<div class="card">GitHub: לא נמצא משתמש בשם הזה.</div>`;
    }
  } catch (e) {
    html += `<div class="card">GitHub: שגיאה בחיבור.</div>`;
  }

  // בדיקת מיקום כללי של IP אם הוזנה כתובת שמכילה נקודות
  if (val.includes(".")) {
    try {
      const ipRes = await fetch(`https://ipwho.is/${encodeURIComponent(val)}`);
      const ipData = await ipRes.json();
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
    } catch (e) {
      html += `<div class="card">GeoIP: לא הצלחתי למשוך נתונים.</div>`;
    }
  }

  outputEl.innerHTML = html;
});
