const form = document.getElementById("candidate-form");
const errorBox = document.getElementById("form-error");
const msgBox = document.getElementById("form-msg");
const addedBox = document.getElementById("added");

// نعرض المهارات المطلوبة فوق النموذج
document.getElementById("required").innerHTML = requiredSkills
  .map(skill => `<span class="tag">${escapeHtml(skill)}</span>`)
  .join("");

// دالة صغيرة: تقرأ قيمة خانة وتشيل المسافات من أطرافها
function read(id) {
  return document.getElementById(id).value.trim();
}

// "تواصل, Excel،  Excel" ← ["تواصل", "Excel"] (نشيل الفاضي والمكرر)
function parseSkills(text) {
  const result = [];

  text.split(/[,،]/).forEach(part => {
    const skill = part.trim();
    const exists = result.some(s => s.toLowerCase() === skill.toLowerCase());

    if (skill && !exists) {
      result.push(skill);
    }
  });

  return result;
}

// نقارن مهاراته بالمطلوب: نطلع النسبة والمهارات الناقصة
function analyze(skills) {
  const have = skills.map(s => s.toLowerCase());
  const missing = requiredSkills.filter(r => !have.includes(r.toLowerCase()));
  const matched = requiredSkills.length - missing.length;
  const match = requiredSkills.length
    ? Math.round((matched / requiredSkills.length) * 100)
    : 0;

  return { match, missing };
}

// نفحص المدخلات: ترجع رسالة خطأ، أو نص فاضي لو كل شي سليم
function validate(name, yearsText, skills, company, role) {
  if (!name) return "اكتبي اسم المرشح.";

  const years = Number(yearsText);
  if (yearsText === "" || !Number.isInteger(years) || years < 0 || years > 50) {
    return "سنوات الخبرة لازم تكون رقم صحيح من ٠ إلى ٥٠.";
  }

  if (skills.length === 0) return "اكتبي مهارة وحدة على الأقل.";
  if (skills.length > 15) return "الحد الأعلى ١٥ مهارة.";
  if (skills.some(s => s.length > 40)) return "اسم المهارة طويل، الحد الأعلى ٤٠ حرف.";

  if ((company || role) && !(company && role)) {
    return "اكتبي الشركة والمسمى الوظيفي معاً، أو اتركيهم فاضيين.";
  }

  return "";
}

// 1) لما تضغطين "إضافة المرشح"
form.addEventListener("submit", async event => {
  event.preventDefault(); // نمنع المتصفح يحدّث الصفحة
  errorBox.textContent = "";
  msgBox.textContent = "";

  const name = read("f-name");
  const yearsText = read("f-years");
  const skills = parseSkills(read("f-skills"));
  const company = read("f-company");
  const role = read("f-role");

  const problem = validate(name, yearsText, skills, company, role);
  if (problem) {
    errorBox.textContent = problem;
    return;
  }

  // لو التحليل الذكي شغال نستخدمه، وإلا (أو لو فشل) الحساب العادي
  let semantic = null;
  if (aiReady) {
    msgBox.textContent = "جاري التحليل الذكي...";
    semantic = await semanticAnalyze(skills, cvLines);
  }

  const { match, missing } = semantic || analyze(skills);
  const newId = Math.max(0, ...candidates.map(c => c.id)) + 1;

  const candidate = {
    id: newId,
    name: name,
    years: Number(yearsText),
    match: match,
    skills: skills,
    missing: missing,
    experience: company ? [{ company: company, role: role, period: read("f-period") }] : [],
    education: read("f-edu"),
    stage: "pending",
    status: "بانتظار الجدولة"
  };

  const extra = loadExtraCandidates();
  extra.push(candidate);

  if (!saveExtraCandidates(extra)) {
    errorBox.textContent = "ما قدرنا نحفظ، تأكدي إن المتصفح يسمح بحفظ البيانات.";
    return;
  }

  candidates.push(candidate);
  form.reset();
  msgBox.textContent = `تمت إضافة ${name}، نسبة التطابق ${match}٪.`;

  // نوضح وش الشي اللي اعتبره النموذج مطابق، عشان تحكمين بنفسك
  if (semantic) {
    const notes = semantic.pairs
      .filter(p => p.score < 1)
      .map(p => `${p.required} ≈ ${p.found} (${Math.round(p.score * 100)}٪)`);
    if (notes.length) {
      msgBox.textContent += " مطابقات بالمعنى: " + notes.join("، ");
    }
  }
  cvLines = [];
  renderAdded();
});

// 2) قائمة المرشحين المضافين مع زر حذف
function renderAdded() {
  const extra = loadExtraCandidates();

  if (extra.length === 0) {
    addedBox.innerHTML = `<p class="muted">ما أضفتي مرشحين بعد.</p>`;
    return;
  }

  addedBox.innerHTML = `<h3>المرشحون المضافون</h3>` + extra.map(c => `
    <div class="added-row">
      <span>${c.id}. ${escapeHtml(c.name)} (${c.match}٪)</span>
      <button class="btn" data-id="${c.id}">حذف</button>
    </div>
  `).join("");
}

addedBox.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (!confirm("تبين تحذفين هذا المرشح؟")) return;

  // نحذفه من المحفوظات
  saveExtraCandidates(loadExtraCandidates().filter(c => c.id !== id));

  // ونشيل موعده من الجدول، وتقييمه المحفوظ (عشان ما يرثهم مرشح جديد بنفس الرقم)
  const schedule = loadSchedule();
  Object.keys(schedule).forEach(key => {
    if (schedule[key] === id) delete schedule[key];
  });
  saveSchedule(schedule);

  saveDecision(id, ""); // نمسح قراره كمان

  try {
    localStorage.removeItem(`interview-${id}`);
  } catch (error) {
    // ما يهم لو ما قدرنا
  }

  const index = candidates.findIndex(c => c.id === id);
  if (index !== -1) candidates.splice(index, 1);

  renderAdded();
});

renderAdded();

// 3) رفع السيرة: نقرأها ونعبّي النموذج
let cvLines = []; // سطور آخر سيرة انرفعت (للتحليل الذكي)
const cvInput = document.getElementById("cv-file");
const cvMsg = document.getElementById("cv-msg");

cvInput.addEventListener("change", async () => {
  const file = cvInput.files[0];
  if (!file) return;

  cvMsg.textContent = "جاري قراءة السيرة...";

  try {
    const text = await extractText(file);
    const cv = parseCv(text);
    cvLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // نحط القيم بـ .value (آمن: ما يتنفذ منها كود)
    document.getElementById("f-name").value = cv.name;
    document.getElementById("f-years").value = cv.years;
    document.getElementById("f-skills").value = cv.skills.join("، ");
    document.getElementById("f-company").value = cv.company;
    document.getElementById("f-role").value = cv.role;
    document.getElementById("f-edu").value = cv.education;

    cvMsg.textContent = cv.skills.length
      ? "تمت التعبئة. راجعي الخانات وعدّليها لو لزم، ثم اضغطي إضافة."
      : "قرينا الملف لكن ما لقينا مهارات معروفة، اكتبيها يدوياً.";
  } catch (error) {
    cvMsg.textContent = error.message;
  }

  cvInput.value = ""; // نفضّي الخانة عشان تقدرين ترفعين نفس الملف مرة ثانية
});

// 4) زر تفعيل التحليل الذكي
const aiBtn = document.getElementById("ai-btn");
const aiMsg = document.getElementById("ai-msg");

aiBtn.addEventListener("click", async () => {
  aiBtn.disabled = true;
  aiMsg.textContent = "جاري تحميل النموذج...";

  try {
    await loadModel(percent => {
      aiMsg.textContent = `جاري تحميل النموذج... ${percent}٪`;
    });
    aiMsg.textContent = "التحليل الذكي شغّال. من الحين المرشحين الجدد يتحسب تطابقهم بالمعنى.";
    aiBtn.textContent = "التحليل الذكي مفعّل";
  } catch (error) {
    aiMsg.textContent = "ما قدرنا نحمّل النموذج (تأكدي من الإنترنت). الموقع يكمل بالحساب العادي.";
    aiBtn.disabled = false;
  }
});