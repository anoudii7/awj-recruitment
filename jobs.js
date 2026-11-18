// الوظيفة المفتوحة تستخدم requiredSkills من data.js ومرشحيها من القائمة
applySchedule(candidates);

const jobs = [
  {
    title: "محلل أمن معلومات",
    team: "فريق الأمن السيبراني",
    type: "دوام كامل",
    open: true,
    about: "مراقبة التنبيهات الأمنية وتحليل السجلات والتعامل مع الحوادث في مركز العمليات.",
    skills: requiredSkills
  },
  {
    title: "مهندس شبكات",
    team: "فريق البنية التقنية",
    type: "دوام كامل",
    open: false,
    about: "تصميم وصيانة شبكات الشركة وضمان توفّرها وأمنها.",
    skills: ["الشبكات", "Firewall", "Linux", "حل المشكلات"]
  },
  {
    title: "أخصائي موارد بشرية",
    team: "فريق الموارد البشرية",
    type: "دوام جزئي",
    open: false,
    about: "إدارة عمليات التوظيف والتواصل مع المرشحين.",
    skills: ["التواصل", "إدارة الوقت", "العمل الجماعي"]
  }
];

const box = document.getElementById("jobs");

box.innerHTML = jobs.map(job => {
  const skills = job.skills.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join("");

  const extra = job.open
    ? `<p class="muted">${candidates.length} مرشح · متوسط التطابق ${
        Math.round(candidates.reduce((sum, c) => sum + c.match, 0) / (candidates.length || 1))
      }٪</p>
       <a class="btn primary" href="index.html">عرض المرشحين</a>`
    : `<p class="muted">لم يبدأ التقديم بعد.</p>`;

  return `
    <article class="panel job">
      <span class="job-badge ${job.open ? "open" : ""}">${job.open ? "مفتوحة" : "قريباً"}</span>
      <h3>${escapeHtml(job.title)}</h3>
      <p class="muted">${escapeHtml(job.team)} · ${escapeHtml(job.type)}</p>
      <p>${escapeHtml(job.about)}</p>
      <h4>المهارات المطلوبة</h4>
      <div class="tags-row">${skills}</div>
      ${extra}
    </article>`;
}).join("");
