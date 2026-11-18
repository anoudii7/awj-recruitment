// الوضع الداكن: نقرأ الاختيار المحفوظ، وإلا نتبع إعداد الجهاز
(function () {
  const key = "theme";
  let theme = "";

  try { theme = localStorage.getItem(key) || ""; } catch (error) {}
  if (theme !== "dark" && theme !== "light") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.documentElement.dataset.theme = theme;

  // نضيف الزر للقائمة بعد ما تجهز الصفحة
  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");
    if (!nav) return;

    const button = document.createElement("button");
    button.className = "theme-btn";
    button.type = "button";

    function paint() {
      const dark = document.documentElement.dataset.theme === "dark";
      button.textContent = dark ? "☀" : "☾";
      button.setAttribute("aria-label", dark ? "الوضع الفاتح" : "الوضع الداكن");
    }

    button.addEventListener("click", () => {
      theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem(key, theme); } catch (error) {}
      paint();
    });

    paint();
    nav.appendChild(button);
  });
})();
