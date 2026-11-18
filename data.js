// بيانات المرشحين (تستخدمها كل صفحات الموقع)
// stage = مرحلة المرشح (للتصفية): pending = بانتظار الجدولة، invited = مدعو للمقابلة
const candidates = [
  {
    id: 1,
    name: "ريم الحربي",
    years: 5,
    match: 83,
    skills: ["تحليل السجلات", "SIEM", "الشبكات", "Linux", "الاستجابة للحوادث"],
    missing: ["التواصل"],
    experience: [{"company": "مركز الأمان الوطني", "role": "محلل أمن معلومات", "period": "٢٠٢٢ – الآن"}, {"company": "شركة نماء للاتصالات", "role": "فني دعم شبكات", "period": "٢٠١٩ – ٢٠٢٢"}],
    education: "بكالوريوس أمن سيبراني · جامعة الأميرة نورة",
    stage: "pending",
    status: "بانتظار الجدولة"
  },
  {
    id: 2,
    name: "خالد المطيري",
    years: 4,
    match: 67,
    skills: ["تحليل السجلات", "SIEM", "الشبكات", "التواصل"],
    missing: ["Linux", "الاستجابة للحوادث"],
    experience: [{"company": "بنك الواحة", "role": "محلل مراقبة أمنية", "period": "٢٠٢٢ – الآن"}],
    education: "بكالوريوس نظم معلومات · جامعة الملك سعود",
    stage: "pending",
    status: "بانتظار الجدولة"
  },
  {
    id: 3,
    name: "سارة القحطاني",
    years: 3,
    match: 67,
    skills: ["الشبكات", "Linux", "الاستجابة للحوادث", "التواصل"],
    missing: ["تحليل السجلات", "SIEM"],
    experience: [{"company": "شركة رؤية التقنية", "role": "مهندسة شبكات", "period": "٢٠٢٣ – الآن"}],
    education: "دبلوم الأمن السيبراني · الكلية التقنية",
    stage: "pending",
    status: "بانتظار الجدولة"
  },
  {
    id: 4,
    name: "فهد الدوسري",
    years: 2,
    match: 33,
    skills: ["الشبكات", "Linux"],
    missing: ["تحليل السجلات", "SIEM", "الاستجابة للحوادث", "التواصل"],
    experience: [{"company": "شركة أفق للحلول", "role": "مسؤول دعم فني", "period": "٢٠٢٤ – الآن"}],
    education: "بكالوريوس علوم حاسب · جامعة الإمام",
    stage: "pending",
    status: "بانتظار الجدولة"
  },
  {
    id: 5,
    name: "لمى الشمري",
    years: 6,
    match: 100,
    skills: ["تحليل السجلات", "SIEM", "الشبكات", "Linux", "الاستجابة للحوادث", "التواصل"],
    missing: [],
    experience: [{"company": "مجموعة سدير", "role": "أخصائية استجابة للحوادث", "period": "٢٠٢١ – الآن"}, {"company": "شركة بيان", "role": "محللة أمن", "period": "٢٠١٨ – ٢٠٢١"}],
    education: "ماجستير أمن المعلومات · جامعة الملك فهد",
    stage: "pending",
    status: "بانتظار الجدولة"
  },
  {
    id: 6,
    name: "ناصر العنزي",
    years: 1,
    match: 33,
    skills: ["التواصل", "Linux"],
    missing: ["تحليل السجلات", "SIEM", "الشبكات", "الاستجابة للحوادث"],
    experience: [{"company": "شركة الندى", "role": "متدرب تقنية معلومات", "period": "٢٠٢٥ – الآن"}],
    education: "دبلوم تقنية معلومات · الكلية التقنية",
    stage: "pending",
    status: "بانتظار الجدولة"
  }
];

// ===== المهارات المطلوبة للوظيفة (الوظيفة: محلل أمن معلومات) =====
// المرشحين المضافين من النموذج تتحسب نسبة تطابقهم عليها تلقائياً
const requiredSkills = ["تحليل السجلات", "SIEM", "الشبكات", "Linux", "الاستجابة للحوادث", "التواصل"];

// ===== حماية: نحول الرموز الخاصة لنص عادي قبل عرض أي كلام كتبه المستخدم =====
// فلو أحد كتب <script> بالاسم، يظهر كنص ولا ينفذ
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===== المرشحون اللي أضفتيهم من النموذج (محفوظين بالمتصفح) =====
const extraKey = "extraCandidates";

// نقرأهم ونتأكد من شكل كل قيمة (حتى بيانات المتصفح ما نثق فيها بدون فحص)
function loadExtraCandidates() {
  try {
    const list = JSON.parse(localStorage.getItem(extraKey));
    if (!Array.isArray(list)) return [];

    return list.map(c => ({
      id: Number(c.id),
      name: String(c.name || ""),
      years: Number(c.years) || 0,
      match: Math.min(100, Math.max(0, Number(c.match) || 0)),
      skills: Array.isArray(c.skills) ? c.skills.map(String) : [],
      missing: Array.isArray(c.missing) ? c.missing.map(String) : [],
      experience: Array.isArray(c.experience)
        ? c.experience.map(j => ({
            company: String(j.company || ""),
            role: String(j.role || ""),
            period: String(j.period || "")
          }))
        : [],
      education: String(c.education || ""),
      stage: "pending",
      status: "بانتظار الجدولة"
    }));
  } catch (error) {
    return [];
  }
}

function saveExtraCandidates(list) {
  try {
    localStorage.setItem(extraKey, JSON.stringify(list));
    return true;
  } catch (error) {
    return false;
  }
}

// نضيفهم لقائمة المرشحين، فكل الصفحات تشوفهم بدون أي تعديل ثاني
candidates.push(...loadExtraCandidates());
