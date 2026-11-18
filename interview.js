// 1) نقرأ رقم المرشح من رابط الصفحة: interview.html?id=2
const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));

// 2) ندور عليه بالبيانات (ما نحط قيمة الرابط مباشرة بالصفحة)
applySchedule(candidates);
const candidate = candidates.find(c => c.id === id);

const box = document.getElementById("interview");

if (!candidate) {
  box.innerHTML = `
    <a class="back" href="index.html">‹ العودة للمرشحين</a>
    <p class="empty">ما لقينا هذا المرشح.</p>
  `;
} else {
  document.title = `مقابلة ${candidate.name}`;

  const skillTags = candidate.skills
    .map(skill => `<span class="tag">${escapeHtml(skill)}</span>`)
    .join("");

  const missingTags = candidate.missing
    .map(skill => `<span class="tag warn">${escapeHtml(skill)}</span>`)
    .join("");

  const experienceItems = candidate.experience.length
    ? candidate.experience
        .map(job => `<li>${[job.company, job.role, job.period].filter(Boolean).map(escapeHtml).join(" · ")}</li>`)
        .join("")
    : `<li class="muted">ما انذكرت خبرات.</li>`;

  // 3) نولّد الأسئلة ونجمعها حسب المجموعة
  const questions = generateQuestions(candidate);
  const groups = {};

  questions.forEach(q => {
    if (!groups[q.group]) {
      groups[q.group] = [];
    }
    groups[q.group].push(q.text);
  });

  const questionsHtml = Object.entries(groups)
    .map(([groupName, texts]) => `
      <h4>${groupName}</h4>
      ${texts.map(text => `
        <label class="q"><input type="checkbox" checked> <span>${escapeHtml(text)}</span></label>
      `).join("")}
    `)
    .join("");

  // 4) نبني الصفحة
  box.innerHTML = `
    <a class="back" href="index.html">‹ العودة للمرشحين</a>
    <h2>مقابلة ${escapeHtml(candidate.name)}</h2>
    <p class="subtitle" id="status-line">${candidate.status}</p>

    <div class="columns">
      <section class="panel panel-cv">
        <h3>السيرة الذاتية</h3>
        <p class="muted">${candidate.years} سنوات خبرة · التطابق ${candidate.match}٪</p>

        <h4>المهارات</h4>
        <div class="tags-row">${skillTags}${missingTags}</div>

        <h4>الخبرات</h4>
        <ul>${experienceItems}</ul>

        <h4>التعليم</h4>
        <p>${escapeHtml(candidate.education) || "ما انذكر."}</p>
      </section>

      <section class="panel panel-questions">
        <h3>أسئلة مقترحة من السيرة</h3>
        <p class="muted">علّمي على الأسئلة اللي تبين تسألينها.</p>
        ${questionsHtml}
      </section>
    </div>

    <section class="panel panel-notes">
      <h3>ملاحظاتك وتقييمك</h3>
      <textarea id="notes" class="notes" rows="4" placeholder="اكتبي ملاحظاتك عن المرشح هنا"></textarea>
      <div class="rating-row">
        <span>التقييم</span>
        <button class="chip rate" data-value="1">١</button>
        <button class="chip rate" data-value="2">٢</button>
        <button class="chip rate" data-value="3">٣</button>
        <button class="chip rate" data-value="4">٤</button>
        <button class="chip rate" data-value="5">٥</button>
      </div>
      <div class="rating-row">
        <span>قرارك</span>
        <button class="chip decide" data-value="accepted">قبول</button>
        <button class="chip decide" data-value="rejected">رفض</button>
      </div>
      <div class="save-row">
        <button class="btn" id="save-btn">حفظ التقييم</button>
        <span class="muted" id="save-msg"></span>
      </div>
    </section>
  `;

  // 5) الملاحظات والتقييم: نحفظها بمتصفحك (localStorage)
  const storageKey = `interview-${candidate.id}`;
  const notesBox = document.getElementById("notes");
  const rateButtons = document.querySelectorAll(".rate");
  const saveBtn = document.getElementById("save-btn");
  const saveMsg = document.getElementById("save-msg");
  let rating = 0;

  function paintRating() {
    rateButtons.forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.value) === rating);
    });
  }

  // نرجّع المحفوظ لو موجود
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) {
      notesBox.value = saved.notes || "";
      rating = Number(saved.rating) || 0;
    }
  } catch (error) {
    // لو ما قدرنا نقرأ، نبدأ فاضي
  }
  paintRating();

  rateButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      rating = Number(btn.dataset.value);
      paintRating();
    });
  });

  saveBtn.addEventListener("click", () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ notes: notesBox.value, rating: rating })
      );
      saveMsg.textContent = "تم الحفظ.";
    } catch (error) {
      saveMsg.textContent = "ما قدرنا نحفظ، تأكدي إن المتصفح يسمح بحفظ البيانات.";
    }
  });

  // 6) القرار: قبول / رفض (الضغط مرة ثانية يلغيه) ويتحفظ فوراً
  const decideButtons = document.querySelectorAll(".decide");
  const statusLine = document.getElementById("status-line");
  let decision = loadDecisions()[candidate.id] || "";

  function paintDecision() {
    decideButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.value === decision);
    });
  }
  paintDecision();

  decideButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      decision = decision === btn.dataset.value ? "" : btn.dataset.value;
      saveDecision(candidate.id, decision);
      paintDecision();

      // نحدّث سطر الحالة بنفس الصفحة
      applySchedule(candidates);
      statusLine.textContent = candidate.status;
    });
  });
}
