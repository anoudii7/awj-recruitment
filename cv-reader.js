// ===== قراءة السيرة الذاتية وتعبئة النموذج تلقائياً =====
// كل شي يصير داخل متصفحك: الملف ما يطلع لأي سيرفر.

const MAX_CV_SIZE = 2 * 1024 * 1024; // ٢ ميغابايت

// قائمة مهارات نعرفها: لو لقينا أي وحدة منها في السيرة نضيفها
// (تقدرين تزيدين عليها مهارات وظيفتك)
const knownSkills = [
  "Python", "JavaScript", "Java", "SQL", "HTML", "CSS", "Excel", "Linux",
  "Networking", "SIEM", "Wireshark", "Nmap", "Git", "Splunk", "Firewall",
  "الشبكات", "الأمن السيبراني", "تحليل البيانات", "إدارة المشاريع",
  "خدمة العملاء", "المبيعات", "التسويق", "المحاسبة", "الموارد البشرية", "تحليل السجلات", "الاستجابة للحوادث"
];

// ١) نقرأ نص الملف (txt مباشرة، pdf عن طريق مكتبة pdf.js)
async function extractText(file) {
  if (file.size > MAX_CV_SIZE) {
    throw new Error("حجم الملف كبير، الحد الأعلى ٢ ميغابايت.");
  }

  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    return await file.text();
  }

  if (name.endsWith(".pdf")) {
    await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = "";
    const pages = Math.min(pdf.numPages, 5); // أول ٥ صفحات تكفي
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n";
    }
    return text;
  }

  throw new Error("الملف لازم يكون PDF أو TXT.");
}

// نحمّل مكتبة pdf.js وقت الحاجة بس (مجانية، من cdnjs)
function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve();
    };
    script.onerror = () => reject(new Error("ما قدرنا نحمّل قارئ PDF، تأكدي من الإنترنت."));
    document.head.appendChild(script);
  });
}

// ٢) نطلع المعلومات من النص بقواعد بسيطة
function parseCv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = { name: "", years: 0, skills: [], company: "", role: "", education: "" };

  // الاسم: أول سطر قصير
  result.name = (lines.find(l => l.length <= 40) || "").slice(0, 60);

  // سنوات الخبرة: أكبر رقم جنب كلمة سنة/سنوات/years
  const yearsMatches = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:سنة|سنوات|years?)/gi)];
  if (yearsMatches.length) {
    result.years = Math.min(50, Math.max(...yearsMatches.map(m => Number(m[1]))));
  }

  // المهارات: كل مهارة معروفة موجودة بالنص
  const lower = text.toLowerCase();
  const all = [...new Set([...requiredSkills, ...knownSkills])];
  result.skills = all.filter(skill => lower.includes(skill.toLowerCase())).slice(0, 15);

  // التعليم: أول سطر فيه كلمة من مؤهل
  const eduLine = lines.find(l => /بكالوريوس|دبلوم|ماجستير|دكتوراه|bachelor|master|diploma|phd/i.test(l));
  result.education = eduLine ? eduLine.slice(0, 80) : "";

  // الشركة والمسمى: سطر بصيغة "المسمى - الشركة" أو "Role at Company"
  const jobLine = lines.find(l => /\s[-–|]\s|\sat\s/i.test(l) && l.length <= 80 && l !== eduLine);
  if (jobLine) {
    const parts = jobLine.split(/\s[-–|]\s|\sat\s/i).map(p => p.trim());
    if (parts.length >= 2) {
      result.role = parts[0].slice(0, 60);
      result.company = parts[1].slice(0, 60);
    }
  }

  return result;
}
