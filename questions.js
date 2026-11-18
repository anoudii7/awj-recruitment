// يولّد أسئلة المقابلة من بيانات المرشح (بدون ذكاء اصطناعي: قواعد بسيطة)
// بكرة لو حبينا نغيّر طريقة التوليد، نغيّر هذي الدالة فقط وبقية الموقع ما يتأثر
function generateQuestions(candidate) {
  const questions = [];

  // 1) أسئلة عن خبراته: سؤال لكل وظيفة بسيرته
  candidate.experience.forEach(job => {
    questions.push({
      group: "عن خبرته",
      text: `حدثني عن أهم إنجاز حققته في ${job.company} بمنصب ${job.role}.`
    });
  });

  // 2) مهارات موجودة بسيرته (نسأل عن أول مهارتين)
  candidate.skills.slice(0, 2).forEach(skill => {
    questions.push({
      group: "مهاراته",
      text: `اشرح لي موقفاً استخدمت فيه ${skill} لحل مشكلة حقيقية.`
    });
  });

  // 3) مهارات مطلوبة وغير ظاهرة بسيرته
  candidate.missing.forEach(skill => {
    questions.push({
      group: "مهارة مطلوبة وغير ظاهرة بسيرته",
      text: `لم أجد ${skill} في سيرتك، كيف ستتعامل مع هذا الجانب من العمل؟`
    });
  });

  // 4) سؤال يختلف حسب سنوات الخبرة
  if (candidate.years <= 2) {
    questions.push({
      group: "أسئلة سلوكية",
      text: "ما أهم شيء تتطلع لتعلمه خلال أول سنة معنا؟"
    });
  } else {
    questions.push({
      group: "أسئلة سلوكية",
      text: "حدثني عن موقف أرشدت فيه زميلاً أقل خبرة منك."
    });
  }

  // 5) سؤال ثابت لكل المرشحين
  questions.push({
    group: "أسئلة سلوكية",
    text: "صف موقفاً اختلفت فيه مع زميل، وكيف حللتم الخلاف؟"
  });

  // 6) لو نسبة التطابق منخفضة نسأل عن دافعه
  if (candidate.match < 70) {
    questions.push({
      group: "أسئلة سلوكية",
      text: "وش اللي شدك لهذي الوظيفة بالذات؟"
    });
  }

  return questions;
}
