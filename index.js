const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// توكن تلغرام الجديد
const TOKEN = "8740801079:AAE9RClZ5QpZ3AsN9SsymvdR0UVfyX6TWQ8";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// توكن Puter
const PUTER_AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImVhU0JreHo2VHVPcFdycVozK0F6Q1E9PSIsInV1IjoiZEUrWjBybkFRazZwUWNxaGJjblpyQT09IiwiaWF0IjoxNzczOTMwODkxfQ.n7LWVnBWqAvYdrjk3NsGKxXpTEv42yxH0xH5Ni51duU";

// آيدي المطور
const ADMIN_ID = 6848455321;

// المجموعة الدائمة (تشتغل فيها بدون أمر)
const PERMANENT_GROUP = -1002928032223;

// المجموعات المفعلة (باستثناء الدائمة)
let enabledGroups = new Set();

// دوال مساعدة
function يحتوي_على_اسم_الجدة(النص) {
  if (!النص) return false;
  const نص_صغير = النص.toLowerCase();
  const الكلمات = [
    "الجدة", "جدتي", "lady fpi", "fpi", "ليدى"
  ];
  return الكلمات.some(كلمة => نص_صغير.includes(كلمة));
}

function اختيار_ايموجي(نوع) {
  const الايموجيات = {
    خطأ: "🚨",
    تصحيح: "✅",
    ترحيب: "👵",
    استفسار: "❓",
    عادي: "💬",
    تحية: "🌺",
    رفض: "🚫"
  };
  return الايموجيات[نوع] || "🤖";
}

// أوامر البوت الرئيسي (مختصرة)
const الاوامر_المعروفة = {
  "3": "/3 [UID] → سكود 3 لاعبين",
  "5": "/5 [UID] → سكود 5 لاعبين",
  "6": "/6 [UID] → سكود 6 لاعبين",
  "inv": "/inv [كود] [UID] → دعوة",
  "dance": "/dance [كود] [UID] [رقم] → رقصة",
  "fast": "/fast [كود] [UID] [رقم] [عدد] → سبام سريع",
  "evo": "/evo [كود] [UID] [1-20] → تطورية",
  "outfit": "/outfit [UID] → صورة الأوتفيت",
  "all_info": "/all_info [UID] → معلومات كاملة",
  "check": "/check [UID] → فحص الحظر",
  "dev": "/dev → معلومات المطور"
};

// قاعدة الأخطاء المحتملة (موسعة)
const تصحيحات_الأخطاء = {
  "danc": "dance",
  "danse": "dance",
  "ev": "evo",
  "evol": "evo",
  "inve": "inv",
  "invt": "inv",
  "oufit": "outfit",
  "outf": "outfit",
  "outfitt": "outfit",
  "chek": "check",
  "chk": "check",
  "alnfo": "all_info",
  "allinfo": "all_info",
  "allnfo": "all_info",
  "st": "stats",  // لو في أمر stats
  "stat": "stats",
  "stts": "stats",
  "devloper": "dev",
  "devoloper": "dev",
  "3": "3",
  "5": "5",
  "6": "6",
  "4": "غير موجود", // 4 مو موجود
  "2": "غير موجود",
  "1": "غير موجود",
  "invet": "inv",
  "invi": "inv",
  "ivn": "inv",
  "fas": "fast",
  "fst": "fast",
  "fase": "fast",
  "dnce": "dance",
  "dancs": "dance",
  "evoo": "evo",
  "evos": "evo",
  "outfittt": "outfit",
  "all_infoo": "all_info",
  "all_inf": "all_info",
  "chekcing": "check",
  "checkk": "check"
};

// كلمات تدل على خروج عن السياق
const كلمات_خارج_السياق = [
  "فيلم", "مسلسل", "أغنية", "موسيقى", "طبخ", "رياضة", "كورة", "مباراة",
  "سياسة", "دين", "مذهب", "فلسفة", "نجوم", "أبراج", "حظ", "سحر",
  "جن", "مس", "علاج", "دواء", "مرض", "مستشفى", "دكتور", "عيادة",
  "جامعة", "مدرسة", "دراسة", "امتحان", "وظيفة", "عمل", "مرتب",
  "زواج", "طلاق", "حب", "علاقة", "خطوبة", "فرح", "عزاء", "ميت"
];

// كلمات السباب (موسعة بالمغربية والعربية)
const كلمات_سباب = [
  // الشتائم الفصحى / عامة عربية
  "كلب", "خنزير", "حمار", "غبي", "أحمق", "تافه", "حقير", "وسخ",
  "ابن الكلب", "يا كلب", "يا حمار", "يا غبي", "يا أحمق",
  // شتائم مغربية شائعة جدًا (دارجة)
  "قحبة", "شرموطة", "كس امك", "كسك", "نيك امك", "نيك", "زبي", "زب",
  "كلب ابن كلب", "حيوان", "بهيمة", "مراكشي", // أحيانًا تُستخدم سلبًا
  "طيزك", "طيز امك", "كس امك يا ولد القحبة", "ابن قحبة", "ابن شرموطة",
  "موسخ", "مقرف", "حقرة", "حرامي", "خايب", "خايب الاصل", "ولد الحرام",
  "بزاز", "بز", "كحل", "كحل امك", "كسختك", "كسخت", "تفو عليك", "يا زبالة",
  "يا كس ام ال...", "يا ولد الكلب", "يا ابن الشرموطة", "يا ابن القحبة",
  "شيطان", "مجنون", "معتوه", "مخنث", "عاهر", "عاهرة", "زانية",
  // تعابير مغربية أخرى شائعة في الغضب
  "شي خنزير", "يا خنزير", "يا كلب الشوارع", "يا ولد الشوارع",
  "يا مسخ", "يا حيوان", "يا بهلول", "يا بليد", "يا مفلس", "يا فاشل",
  "يا رخيص", "يا رخاص", "يا وضيع", "يا منحط", "يا دنيء",
  // أشكال مختصرة أو مشتقة منتشرة
  "كس", "زب", "نيک", "شرموط", "قحب", "ابن قحب", "كس ام", "نك امك"
];

// ردود متنوعة على السباب بنصائح دينية وأخلاقية
const ردود_نصيحة = [
  "👵 يا ولدي، اللسان حاد كالسيف، والكلام السيء يحرق صاحبه قبل غيره. اتقِ الله وكف عن هذا الكلام، ربي غفور رحيم.",
  "🌺 يا صغيري، السباب من عمل الشيطان، والمؤمن يحفظ لسانه. قال رسول الله ﷺ: «من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت».",
  "👵 يا بني، الكلام الطيب صدقة، والشتيمة خطيئة. استغفر ربك وعدل اللسان، الجنة تحت ظلال الكلام الحسن.",
  "🚫 يا ولدي، هذا الكلام ما ينفع لا في الدنيا ولا في الآخرة. الله يهديك ويطهر قلبك من الغضب والقبح.",
  "👵 الحسنة تزيل السيئة، فبدل ما تسب، ادعُ لي بالهداية ولنفسك بالصلاح. ربي يصلح الأحوال."
];

// هل النص يحتوي على كلمات خارجة عن السياق؟
function يحتوي_على_كلمات_خارج_السياق(النص) {
  const نص_صغير = النص.toLowerCase();
  return كلمات_خارج_السياق.some(كلمة => نص_صغير.includes(كلمة));
}

// هل النص يحتوي على سباب؟
function يحتوي_على_سباب(النص) {
  const نص_صغير = النص.toLowerCase();
  return كلمات_سباب.some(كلمة => نص_صغير.includes(كلمة));
}

// هل النص هو سلام عليكم؟
function هو_سلام(النص) {
  const نص_صغير = النص.toLowerCase().trim();
  const تحيات = ["السلام عليكم", "سلام عليكم", "سلام", "السلام", "عليكم السلام", "سلام عليكم ورحمة الله"];
  return تحيات.some(تحية => نص_صغير.includes(تحية));
}

function اقتراح_الأمر_الصحيح(نص_خاطئ) {
  const بدون_سلاش = نص_خاطئ.replace('/', '');
  
  // إذا كان الأمر موجودًا في القائمة
  if (بدون_سلاش in الاوامر_المعروفة) {
    return الاوامر_المعروفة[بدون_سلاش];
  }
  
  // ابحث في قاعدة الأخطاء
  if (بدون_سلاش in تصحيحات_الأخطاء) {
    const الصحيح = تصحيحات_الأخطاء[بدون_سلاش];
    if (الصحيح in الاوامر_المعروفة) {
      return الاوامر_المعروفة[الصحيح];
    }
  }
  
  return null;
}

app.post("/webhook", async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || "صغيري";
  const النص = msg.text.trim();
  const نوع_المحادثة = msg.chat.type; // private, group, supergroup
  const messageId = msg.message_id;

  // ---------- أوامر التحكم ----------
  if (النص === "/lady" && userId === ADMIN_ID) {
    if (نوع_المحادثة === "group" || نوع_المحادثة === "supergroup") {
      if (chatId === PERMANENT_GROUP) {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "👵 يا مطوري، أنا هنا على طول، ما أحتاج تفعيل",
            reply_to_message_id: messageId
          })
        });
      } else {
        enabledGroups.add(chatId);
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ تم تفعيل الجدة. إذا حدا عنده سؤال بالأوامر أنا جاهزة",
            reply_to_message_id: messageId
          })
        });
      }
    }
    return res.sendStatus(200);
  }

  if (النص === "/stop_lady" && userId === ADMIN_ID) {
    if (نوع_المحادثة === "group" || نوع_المحادثة === "supergroup") {
      if (chatId === PERMANENT_GROUP) {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "👵 لا أقدر أطلع من هالمجموعة يا مطوري",
            reply_to_message_id: messageId
          })
        });
      } else {
        enabledGroups.delete(chatId);
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "👵 معطلة، إذا بدكم إياي رجعوا قولو /lady",
            reply_to_message_id: messageId
          })
        });
      }
    }
    return res.sendStatus(200);
  }

  // ---------- لا تعمل في الخاص إلا مع المطور ----------
  if (نوع_المحادثة === "private" && userId !== ADMIN_ID) {
    return res.sendStatus(200);
  }

  // ---------- في المجموعات: تعمل فقط في المجموعات المفعلة + الدائمة ----------
  if (نوع_المحادثة === "group" || نوع_المحادثة === "supergroup") {
    if (chatId !== PERMANENT_GROUP && !enabledGroups.has(chatId)) {
      return res.sendStatus(200);
    }
  }

  // ---------- 1. التحقق من السلام عليكم ----------
  if (هو_سلام(النص)) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `${اختيار_ايموجي("تحية")} وعليكم السلام ورحمة الله وبركاته يا ${userName}، كيف أستطيع مساعدتك اليوم؟`,
        reply_to_message_id: messageId
      })
    });
    return res.sendStatus(200);
  }

  // ---------- 2. التحقق من السباب ----------
  if (يحتوي_على_سباب(النص)) {
    // اختيار رد عشوائي من قائمة النصائح
    const رد_عشوائي = ردود_نصيحة[Math.floor(Math.random() * ردود_نصيحة.length)];
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: رد_عشوائي,
        reply_to_message_id: messageId
      })
    });
    return res.sendStatus(200);
  }

  // ---------- 3. التحقق من الخروج عن السياق ----------
  const يحتوي_على_اسم = يحتوي_على_اسم_الجدة(النص);
  if (!النص.startsWith('/') && !يحتوي_على_اسم && يحتوي_على_كلمات_خارج_السياق(النص)) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `${اختيار_ايموجي("رفض")} عذرًا يا بني، هذا الكلام خارج نطاق اختصاصي. أنا هنا لمساعدة المستخدمين في أوامر بوت Free Fire فقط.`,
        reply_to_message_id: messageId
      })
    });
    return res.sendStatus(200);
  }

  // ---------- 4. معالجة الأوامر الخاطئة ----------
  const هو_أمر_تلغرام = النص.startsWith('/');
  if (هو_أمر_تلغرام) {
    const الامر_المقترح = اقتراح_الأمر_الصحيح(النص);
    if (الامر_المقترح) {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${اختيار_ايموجي("تصحيح")} يا بني، الأمر الصحيح هو:\n${الامر_المقترح}`,
          reply_to_message_id: messageId
        })
      });
    } else {
      // أمر غير معروف تمامًا
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${اختيار_ايموجي("استفسار")} يا ${userName}، هذا الأمر غير معروف لدي. هل تريد مساعدة في أحد أوامر البوت؟`,
          reply_to_message_id: messageId
        })
      });
    }
    return res.sendStatus(200);
  }

  // ---------- 5. إذا لم يذكر اسم الجدة، لا ترد ----------
  if (!يحتوي_على_اسم) {
    return res.sendStatus(200);
  }

  // ---------- 6. استدعاء الذكاء الاصطناعي (للأسئلة العامة عن البوت) ----------
  try {
    const systemPrompt = `
أنت Lady FPI، جدة حكيمة ولطيفة، تتحدثين بالفصحى والعامية قليلاً. 
مهمتك الأساسية هي مساعدة المستخدمين في فهم واستخدام أوامر بوت Free Fire المسمى ZAKARIA BOT.

قائمة الأوامر التي تشرحينها:
- /3 [UID] : إنشاء سكود 3 لاعبين
- /5 [UID] : إنشاء سكود 5 لاعبين
- /6 [UID] : إنشاء سكود 6 لاعبين
- /inv [كود] [UID] : دعوة لاعب إلى فريق
- /dance [كود] [UID] [رقم] : رقصة
- /fast [كود] [UID] [رقم] [عدد] : سبام سريع
- /evo [كود] [UID] [1-20] : إيموجي تطوري
- /outfit [UID] : صورة الأوتفيت
- /all_info [UID] : كل معلومات اللاعب
- /check [UID] : فحص الحظر
- /dev : معلومات المطور

أنت تردين فقط على الأسئلة المتعلقة بهذه الأوامر أو بمشاكل استخدام البوت. 
إذا سأل المستخدم عن شيء خارج هذا السياق (مثل الرياضة، السياسة، الترفيه، etc.)، تعتذرين بلطف وتذكري أنك هنا فقط للمساعدة في البوت.
إذا أخطأ المستخدم في كتابة أمر، تصححين له الأمر الصحيح.
تستخدمين لغة عربية فصحى واضحة، مع قليل من المرح واللطافة.
تذكرين اسم المستخدم في ردك (يا بني، يا صغيري) باستخدام المتغير ${userName}.
تردين دائمًا على رسالة المستخدم (reply) عشان يعرف أنك تقصدينه.

أمثلة على الردود المناسبة:
- س: كيف أستخدم /dance؟
  ج: يا بني، أمر /dance يستخدم كالتالي: /dance [كود الفريق] [UID] [رقم الإيموجي]. مثال: /dance XYZ123 123456789 5.
- س: وش معنى خطأ 503؟
  ج: هذا يعني أن سيرفر البوت مشغول، حاول مرة أخرى بعد قليل يا صغيري.
- س: أبي فيلم جديد؟
  ج: عذرًا يا بني، أنا هنا فقط لمساعدة في أوامر بوت Free Fire. لا أستطيع مساعدتك في الأفلام.

حافظي على الإجابات مختصرة ومفيدة. استخدمي إيموجي واحد مناسب.
`;

    const aiResponse = await fetch("https://api.puter.com/puterai/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PUTER_AUTH_TOKEN}`
      },
      body: JSON.stringify({
        model: "x-ai/grok-4.1-fast",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: النص }
        ],
        temperature: 0.6,
        max_tokens: 300
      })
    });

    if (!aiResponse.ok) {
      return res.sendStatus(200);
    }

    const data = await aiResponse.json();
    let الرد = data.choices?.[0]?.message?.content?.trim();

    if (!الرد) {
      الرد = `${اختيار_ايموجي("عادي")} تفضلي يا ${userName}، أنا هنا لمساعدتك.`;
    }

    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: الرد,
        reply_to_message_id: messageId
      })
    });

  } catch (error) {
    console.error("خطأ:", error);
  }

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("🌺 Lady FPI - النسخة المحسنة");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🌺 Lady FPI شغالة على المنفذ ${port}`);
});
