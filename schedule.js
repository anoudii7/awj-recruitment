// الأيام والأوقات ودوال القراءة والحفظ جاية من schedule-store.js
let schedule = loadSchedule();

const grid = document.getElementById("grid");
const summary = document.getElementById("summary");

// 1) دالة ترسم الجدول كله
function render() {
  let html = "<div></div>";
  html += days.map(day => `<strong>${day}</strong>`).join("");

  times.forEach((time, t) => {
    html += `<span>${time}</span>`;

    days.forEach((day, d) => {
      const key = `${d}-${t}`;
      const chosen = schedule[key];

      const options = candidates.map(c => {
        // المرشح اللي له موعد بخانة ثانية نمنع اختياره هنا (ما ينحجز مرتين)
        const bookedElsewhere = Object.entries(schedule)
          .some(([k, v]) => v === c.id && k !== key);

        return `<option value="${c.id}"
          ${c.id === chosen ? "selected" : ""}
          ${bookedElsewhere ? "disabled" : ""}>${c.id}. ${escapeHtml(c.name)}</option>`;
      }).join("");

      html += `
        <select class="slot ${chosen ? "filled" : ""}" data-key="${key}"
                aria-label="${day} ${time}">
          <option value="">متاح</option>
          ${options}
        </select>`;
    });
  });

  grid.innerHTML = html;

  const count = Object.keys(schedule).length;
  summary.textContent =
    `${count} مقابلة مجدولة · ${candidates.length - count} مرشح بدون موعد`;
}

// 2) لما تختارين مرشح بخانة: نحفظ ونعيد الرسم
grid.addEventListener("change", event => {
  if (!event.target.matches(".slot")) return;

  const key = event.target.dataset.key;
  const value = event.target.value;

  if (value) {
    schedule[key] = Number(value);
  } else {
    delete schedule[key];
  }

  saveSchedule(schedule);
  render();
});

// 3) التوزيع التلقائي: الأعلى تطابقاً ياخذ أبكر موعد فاضي
document.getElementById("auto-btn").addEventListener("click", () => {
  const waiting = [...candidates]
    .sort((a, b) => b.match - a.match)
    .filter(c => !Object.values(schedule).includes(c.id));

  let next = 0;

  days.forEach((day, d) => {
    times.forEach((time, t) => {
      const key = `${d}-${t}`;

      if (!schedule[key] && next < waiting.length) {
        schedule[key] = waiting[next].id;
        next++;
      }
    });
  });

  saveSchedule(schedule);
  render();
});

// 4) زر مسح الجدول (نتأكد قبل الحذف)
document.getElementById("clear-btn").addEventListener("click", () => {
  if (confirm("تبين تمسحين كل المواعيد؟")) {
    schedule = {};
    saveSchedule(schedule);
    render();
  }
});

// 5) تنزيل الجدول كملف CSV يفتح بإكسل
// حماية: لو الخلية تبدأ بـ = + - @ ممكن إكسل يعتبرها معادلة، فنحط قبلها علامة '
function csvCell(value) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

document.getElementById("export-btn").addEventListener("click", () => {
  const rows = [["اليوم", "الوقت", "المرشح", "التطابق"]];

  days.forEach((day, d) => {
    times.forEach((time, t) => {
      const c = candidates.find(x => x.id === schedule[`${d}-${t}`]);
      if (c) rows.push([day, time, c.name, c.match + "%"]);
    });
  });

  if (rows.length === 1) {
    summary.textContent = "ما فيه مقابلات مجدولة عشان تنزل.";
    return;
  }

  // ﻿ يخلي إكسل يقرأ العربي صح
  const csv = "﻿" + rows.map(r => r.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "interview-schedule.csv";
  link.click();
  URL.revokeObjectURL(url);
});

render();
