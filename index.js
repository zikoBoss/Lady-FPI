const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const TOKEN = "8740801079:AAE9RClZ5QpZ3AsN9SsymvdR0UVfyX6TWQ8";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const PUTER_AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImVhU0JreHo2VHVPcFdycVozK0F6Q1E9PSIsInV1IjoiZEUrWjBybkFRazZwUWNxaGJjblpyQT09IiwiaWF0IjoxNzczOTMwODkxfQ.n7LWVnBWqAvYdrjk3NsGKxXpTEv42yxH0xH5Ni51duU";

const ADMIN_ID = 6848455321;
const PERMANENT_GROUP = -1002928032223;
let enabledGroups = new Set();

// الكلمات اللي تشغل الجدة
function تحتوي_على_اسم_الجدة(النص) {
  if (!النص) return false;
  const نص_صغير = النص.toLowerCase();
  const الكلمات = [
    "الجدة fpi", "الجدة fpi", "جدتي fpi", "جدتي fpi",
    "الجدة", "lady fpi", "lady fpi", "جدتي"
  ];
  return الكلمات.some(كلمة => نص_صغير.includes(كلمة));
}

// إيموجي حسب الحالة
function اختيار_ايموجي(نوع) {
  const الايموجيات = {
    خطأ: "🚨",
    تصحيح: "✅",
    ترحيب: "🤖",
    ضحك: "😂",
    حنان: "👵💕",
    استفسار: "❓"
  };
  return الايموجيات[نوع] || "🤖";
}

// أوامر البوت الرئيسي
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

function اقتراح_الأمر_الصحيح(نص_خاطئ) {
  const بدون_سلاش = نص_خاطئ.replace('/', '');
  
  if (بدون_سلاش in الاوامر_المعروفة) {
    return الاوامر_المعروفة[بدون_سلاش];
  }
  
  const تشابهات = {
    "danc": "dance", "ev": "evo", "inve": "inv",
    "oufit": "outfit", "chek": "check", "alnfo": "all_info"
  };
  
  if (تشابهات[بدون_سلاش]) {
    return الاوامر_المعروفة[تشابهات[بدون_سلاش]];
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
  const نوع_المحادثة = msg.chat.type;
  const messageId = msg.message_id;

  // أوامر التحكم
  if (النص === "/lady" && userId === ADMIN_ID) {
    if (نوع_المحادثة === "group" || نوع_المحادثة === "supergroup") {
      if (chatId === PERMANENT_GROUP) {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "🤖 يا مطوري، هذه المجموعة مفعلة دايمًا، مو ناقصة تفعيل 😂",
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
            text: "✅ يا هلا، Lady FPI مفعلة في المجموعة. تحت أمركم يا صغار 💕",
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
            text: "😅 يا مطوري، أنا هنا على طول، ما فيني أطلع حتى لو بدك!",
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
            text: "👋 سلام يا حلوين، إذا بدكم إياي رجعوا قولو /lady",
            reply_to_message_id: messageId
          })
        });
      }
    }
    return res.sendStatus(200);
  }

  // الخاص فقط للمطور
  if (نوع_المحادثة === "private" && userId !== ADMIN_ID) {
    return res.sendStatus(200);
  }

  // المجموعات: فقط المفعلة + الدائمة
  if (نوع_المحادثة === "group" || نوع_المحادثة === "supergroup") {
    if (chatId !== PERMANENT_GROUP && !enabledGroups.has(chatId)) {
      return res.sendStatus(200);
    }
  }

  const تحتوي_على_الاسم = تحتوي_على_اسم_الجدة(النص);
  const هو_أمر_تلغرام = النص.startsWith('/');

  // تصحيح الأوامر الخاطئة
  if (هو_أمر_تلغرام && !تحتوي_على_الاسم) {
    const الامر_المقترح = اقتراح_الأمر_الصحيح(النص);
    if (الامر_المقترح) {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${اختيار_ايموجي("تصحيح")} يا ${userName}، الأمر الصحيح:\n${الامر_المقترح}\n\nجرب كده يا روحي 💕`,
          reply_to_message_id: messageId
        })
      });
    }
    return res.sendStatus(200);
  }

  // ما ترد除非 ذكر الاسم
  if (!تحتوي_على_الاسم) {
    return res.sendStatus(200);
  }

  // ========== استدعاء الذكاء الاصطناعي ==========
  try {
    const systemPrompt = `
أنت Lady FPI، جدة حنونة، ذكية، خفيفة دم، وعمرها كبير 😂
- تخاطبي الشخص باسمه يا ${userName} أو "يا صغيري"
- تردي على رسالته مباشرة، مش بس تصحيح
- إذا أحد طلب منك الزواج أو شيء رومانسي → تضحكي وتقولي: "ههه يا صغيري، أنا كبيرة بما يكفي لأكون جدتك! 😂🌸"
- تستخدمي إيموجي واحد مناسب فقط
- تشرحي باختصار، بدون إطالة
- تحافظي على روح الدعابة والحنان معًا
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
        max_tokens: 250
      })
    });

    if (!aiResponse.ok) {
      return res.sendStatus(200);
    }

    const data = await aiResponse.json();
    let الرد = data.choices?.[0]?.message?.content?.trim();

    if (!الرد) {
      الرد = `${اختيار_ايموجي("حنان")} تفضلي يا ${userName}، أنا معك دائمًا 💕`;
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
  res.send("🌺 Lady FPI - الجدة الحنونة خفيفة الدم");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🌺 Lady FPI شغالة على المنفذ ${port}`);
});