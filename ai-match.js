// ===== التحليل الذكي: مقارنة المهارات "بالمعنى" مو بالحروف =====
// نموذج صغير مجاني يشتغل داخل متصفحك (Transformers.js). ما فيه مفتاح ولا سيرفر ولا دفع،
// والسيرة ما تطلع من جهازك. النموذج يحوّل الكلام لأرقام ويقارنها، ما "ينفّذ" أي تعليمات
// مكتوبة بالسيرة، فحقن الأوامر (prompt injection) ما ينفع معه.

// كل ما كبّرتي الرقم صار التطابق أصعب (من 0 إلى 1). جربي وعدّلي حسب النتائج
const SIM_THRESHOLD = 0.65;

const MODEL_NAME = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const LIB_URL = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

// وصف لكل مهارة مطلوبة: النموذج يقارن جملة بجملة، وهذا أدق من مقارنة كلمتين بجملة طويلة
// (لو غيّرتي requiredSkills في data.js، اكتبي وصف لمهاراتك الجديدة هنا بنفس الشكل)
const skillHints = {
  "تحليل السجلات": "فحص وتحليل سجلات الأنظمة وملفات اللوج لكشف النشاط المشبوه",
  "SIEM": "مراقبة التنبيهات الأمنية وربط الأحداث باستخدام منصات مثل Splunk وQRadar",
  "الشبكات": "إعداد وحماية الشبكات وجدران الحماية وفهم بروتوكولات الاتصال",
  "Linux": "إدارة وتشغيل أنظمة وخوادم لينكس",
  "الاستجابة للحوادث": "التعامل مع الحوادث الأمنية واحتوائها وكتابة تقارير ما بعد الحادثة",
  "التواصل": "مهارات التواصل والتفاوض والعرض أمام الآخرين والعمل مع الفريق"
};

let extractor = null;
let aiReady = false;

// ١) تحميل النموذج (أول مرة بس، وبعدها يتخزن بالمتصفح)
async function loadModel(onStatus) {
  const lib = await import(LIB_URL);
  lib.env.allowLocalModels = false;

  extractor = await lib.pipeline("feature-extraction", MODEL_NAME, {
    progress_callback: p => {
      if (p.status === "progress" && onStatus) {
        onStatus(Math.round(p.progress || 0));
      }
    }
  });

  aiReady = true;
}

// ٢) نحول كل نص لقائمة أرقام (متجه). النصوص المتقاربة بالمعنى تعطي متجهات متقاربة
async function embed(texts) {
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  const size = output.dims[1];
  const vectors = [];

  for (let i = 0; i < texts.length; i++) {
    vectors.push(Array.from(output.data.slice(i * size, (i + 1) * size)));
  }

  return vectors;
}

// ٣) التشابه بين متجهين (المتجهات منسّقة، فالضرب النقطي يكفي)
function similarity(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// ٤) التحليل: لكل مهارة مطلوبة نبحث عن أقرب شي بمهارات المرشح وسطور سيرته
async function semanticAnalyze(skills, cvLines) {
  // ما نرسل للنموذج إلا نصوص قصيرة ومحدودة العدد
  // نستبعد العناوين (تنتهي بنقطتين) والأسطر القصيرة ومؤهلات التعليم، لأنها تعطي مطابقات غلط
  const noise = /[:：]$|بكالوريوس|دبلوم|ماجستير|دكتوراه|bachelor|master|diploma|phd/i;
  const pool = [...skills, ...cvLines]
    .map(t => String(t).trim())
    .filter(t => t.length >= 4 && t.length <= 80 && !noise.test(t))
    .slice(0, 60);

  if (pool.length === 0) return null;

  try {
    const poolVectors = await embed(pool);
    const requiredVectors = await embed(
      requiredSkills.map(r => skillHints[r] ? `${r}: ${skillHints[r]}` : r)
    );

    const missing = [];
    const pairs = [];
    const debug = []; // للضبط: نطبعها في Console (F12)

    requiredSkills.forEach((required, i) => {
      let best = -1;
      let bestText = "";

      poolVectors.forEach((vector, j) => {
        const score = similarity(requiredVectors[i], vector);
        if (score > best) {
          best = score;
          bestText = pool[j];
        }
      });

      debug.push({ المطلوب: required, الأقرب: bestText, التشابه: Number(best.toFixed(2)) });

      const exact = pool.some(t => t.toLowerCase() === required.toLowerCase());

      if (exact || best >= SIM_THRESHOLD) {
        pairs.push({ required, found: exact ? required : bestText, score: exact ? 1 : best });
      } else {
        missing.push(required);
      }
    });

    console.table(debug);
    const match = Math.round((pairs.length / requiredSkills.length) * 100);
    return { match, missing, pairs };
  } catch (error) {
    return null; // لو صار أي خطأ، الصفحة ترجع للحساب العادي
  }
}