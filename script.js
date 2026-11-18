// حالة كل مرشح تجي من الجدول (schedule-store.js)
applySchedule(candidates);

// 2) مكان عرض البطاقات
const list = document.getElementById("candidates-list");

// 3) دالة تبني بطاقة واحدة
function createCard(candidate, index) {
  const skillTags = candidate.skills
    .map(skill => `<span class="tag">${escapeHtml(skill)}</span>`)
    .join("");

  const missingTags = candidate.missing
    .map(skill => `<span class="tag warn">${escapeHtml(skill)}</span>`)
    .join("");

  return `
    <article class="card" style="animation-delay: ${index * 80}ms">
      <div class="rank">${index + 1}</div>
      <div class="info">
        <strong>${escapeHtml(candidate.name)}</strong>
        <span>${candidate.years} سنوات خبرة</span>
      </div>
      <div class="match">
        <span>التطابق مع المتطلبات ${candidate.match}٪</span>
        <div class="bar"><div class="bar-fill" style="width: ${candidate.match}%"></div></div>
      </div>
      <div class="tags">${skillTags}${missingTags}</div>
      <span class="status">${candidate.status}</span>
      <a class="btn" href="interview.html?id=${candidate.id}">السيرة والأسئلة</a>
    </article>
  `;
}

// 4) حالة العرض الحالية: الفلتر + البحث + الترتيب
let currentFilter = "all";
let query = "";
let sortBy = "match";

// 5) دالة العرض: تفلتر وتبحث وترتب، وبعدها تبني البطاقات
function render() {
  let shown = currentFilter === "all"
    ? [...candidates]
    : candidates.filter(c => c.stage === currentFilter);

  const q = query.trim().toLowerCase();
  if (q) {
    shown = shown.filter(c => c.name.toLowerCase().includes(q));
  }

  shown.sort(sortBy === "years"
    ? (a, b) => b.years - a.years
    : (a, b) => b.match - a.match);

  if (shown.length === 0) {
    list.innerHTML = `<p class="empty">ما فيه مرشحين بهذي الحالة حالياً.</p>`;
    return;
  }

  list.innerHTML = shown.map(createCard).join("");
}

// 6) أزرار التصفية + البحث + الترتيب
const chips = document.querySelectorAll(".chip");

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    render();
  });
});

document.getElementById("search").addEventListener("input", event => {
  query = event.target.value;
  render();
});

document.getElementById("sort").addEventListener("change", event => {
  sortBy = event.target.value === "years" ? "years" : "match";
  render();
});

// 7) أول عرض عند فتح الصفحة
render();

// 8) عدّاد متحرك للإحصائيات
function countUp(element, target, suffix = "") {
  // لو الشخص يفضل تقليل الحركة، نعرض الرقم النهائي مباشرة
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = target + suffix;
    return;
  }

  const duration = 900;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased) + suffix;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

const total = candidates.length;
const pending = candidates.filter(c => c.stage === "pending").length;
const average = Math.round(
  candidates.reduce((sum, c) => sum + c.match, 0) / candidates.length
);

countUp(document.getElementById("stat-total"), total);
countUp(document.getElementById("stat-pending"), pending);
const accepted = candidates.filter(c => c.decision === "accepted").length;
countUp(document.getElementById("stat-accepted"), accepted);
countUp(document.getElementById("stat-match"), average, "٪");
