// ملف مشترك: الصفحات الثلاث (القائمة، المقابلة، الجدول) تستخدمه

const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const times = ["٩:٠٠ ص", "١٠:٠٠ ص", "١١:٠٠ ص", "١٢:٠٠ م"];
const scheduleKey = "schedule";

// نقرأ الجدول المحفوظ: كائن مثل { "0-1": 3 } (يوم-وقت ← رقم المرشح)
function loadSchedule() {
  try {
    return JSON.parse(localStorage.getItem(scheduleKey)) || {};
  } catch (error) {
    return {};
  }
}

function saveSchedule(schedule) {
  try {
    localStorage.setItem(scheduleKey, JSON.stringify(schedule));
  } catch (error) {
    // لو المتصفح يمنع الحفظ، الصفحة تبقى شغالة بس ما يتحفظ
  }
}

// ===== قرار المقابلة: مقبول / مرفوض (محفوظ بالمتصفح) =====
const decisionKey = "decisions";
const decisionLabels = { accepted: "مقبول", rejected: "مرفوض" };

// كائن مثل { "3": "accepted" } ونقبل بس القيمتين المعروفتين
function loadDecisions() {
  try {
    const raw = JSON.parse(localStorage.getItem(decisionKey)) || {};
    const clean = {};
    Object.keys(raw).forEach(id => {
      if (raw[id] === "accepted" || raw[id] === "rejected") clean[id] = raw[id];
    });
    return clean;
  } catch (error) {
    return {};
  }
}

// value = "accepted" أو "rejected" أو "" لمسح القرار
function saveDecision(id, value) {
  const decisions = loadDecisions();
  if (value === "accepted" || value === "rejected") {
    decisions[id] = value;
  } else {
    delete decisions[id];
  }
  try {
    localStorage.setItem(decisionKey, JSON.stringify(decisions));
  } catch (error) {
    // ما يتحفظ لو المتصفح يمنع
  }
}

// نحدّث حالة كل مرشح حسب الجدول: لو له موعد يصير "مدعو" وإلا "بانتظار"
function applySchedule(list) {
  const schedule = loadSchedule();
  const decisions = loadDecisions();

  list.forEach(c => {
    const entry = Object.entries(schedule).find(([key, id]) => id === c.id);

    if (entry) {
      const [d, t] = entry[0].split("-").map(Number);
      c.stage = "invited";
      c.status = `مجدول: ${days[d]} ${times[t]}`;
    } else {
      c.stage = "pending";
      c.status = "بانتظار الجدولة";
    }

    // لو اتخذتي قرار، يغلب على بقية الحالات
    c.decision = decisions[c.id] || "";
    if (c.decision) {
      c.stage = "decided";
      c.status = decisionLabels[c.decision];
    }
  });
}
