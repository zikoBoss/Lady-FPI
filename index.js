const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// توكناتك
const TOKEN = "8740801079:AAE9RClZ5QpZ3AsN9SsymvdR0UVfyX6TWQ8";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const PUTER_AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImVhU0JreHo2VHVPcFdycVozK0F6Q1E9PSIsInV1IjoiZEUrWjBybkFRazZwUWNxaGJjblpyQT09IiwiaWF0IjoxNzczOTMwODkxfQ.n7LWVnBWqAvYdrjk3NsGKxXpTEv42yxH0xH5Ni51duU";

const ADMIN_ID = 6848455321;
const PERMANENT_GROUP = -1002928032223;

let enabledGroups = new Set();
let userMemories = new Map();
let userHeat = new Map(); // للحرارة / الشهوة

// صور Skini - املأ أكثر لو قدرتي (رفع على postimg.cc أفضل)
const صور_سكيني = [
  "https://s59.erome.com/7520/mpw4MWo8/k7F6kMAg.jpg?v=1772945186", // بزاز
  "https://s44.erome.com/5282/oK9YcMns/QwLI5mNL.jpeg?v=1766280418", // مؤخرة
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRO-Gu1hhGJPR9h23fmR0RolbSB_AfAjsCDyGTwlI1QwA&s=10", // كس
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRX5D7WU66drjNw2q18-qaPDm9mBtEgotYRpQ_-Oa-05PE9PltxPF2-3dGX&s=10", // كس آخر
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1sDMqygt-ILPpzDbY1Aveevt24ltO5vVkX4koMf1FoVYFM438VK5mhh7a&s=10", // فتحة طيز
  "https://c3.ttcache.com/thumbnail/4zuaLeVrp9A/288x162/4.jpg", // تتناك من طيزها
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSScyE1Uhht6yDIhMz-ZTqvD8I23MKYLppOrVjF_auWtw&s=10", // تتناك من كسها
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXqL9hbr8EPibKBglkJ83d31oV4I2om29PXQbGn1ZeNDm26qRlPEKR7E63&s=10", // بزاز / تتناك من بزاز
  // زد روابط جديدة explicit هنا لو لقيتي
];

const صور_كس = صور_سكيني.filter(link => link.includes("pussy") || link.includes("كس") || link.includes("RO-Gu") || link.includes("RX5D7"));
const صور_طيز = صور_سكيني.filter(link => link.includes("ass") || link.includes("طيز") || link.includes("QwLI") || link.includes("S1sDM"));
const صور_بزاز = صور_سكيني.filter(link => link.includes("tits") || link.includes("بزاز") || link.includes("k7F6k") || link.includes("SXqL9"));
const صور_سيكس = صور_سكيني.filter(link => link.includes("sex") || link.includes("تتناك") || link.includes("4zua") || link.includes("SScyE"));

// رسائل عشوائية فسق
const رسائل_فسق = [
  "😈 يا ولاد القحبة، كس سكيني مبلول وجاهز... مين غادي يجي ينيكني دلوقت؟",
  "البنات شرموطات رخيصات، الشباب ورّيو زبيكم الكبير لسكيني 🔥",
  "طيزي كتترجف على زبكم... حد بغى يفتح فتحتي ويدخل بقوة؟",
  "بزازي كبار وطريين، جيو نرضعهم حتى تفيقو 😈"
];

setInterval(async () => {
  for (let gid of enabledGroups) {
    if (Math.random() > 0.5) {
      const txt = رسائل_فسق[Math.floor(Math.random() * رسائل_فسق.length)];
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({chat_id: gid, text: txt})
      });
    }
  }
}, 600000); // 10 دقايق

function sendMsg(chatId, text, replyId) {
  return fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, text, reply_to_message_id: replyId})
  });
}

function sendPhoto(chatId, photo, caption, replyId) {
  return fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, photo, caption, reply_to_message_id: replyId})
  });
}

app.post("/webhook", async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || "يا زب";
  const text = msg.text.trim();
  const lowerText = text.toLowerCase();
  const messageId = msg.message_id;

  // تحكم
  if (lowerText === "/skini" && userId === ADMIN_ID) {
    enabledGroups.add(chatId);
    await sendMsg(chatId, "😈 سكيني وصلات يا كلاب... اللي بغى ينيك يفتح كسو", messageId);
    return res.sendStatus(200);
  }

  if (lowerText === "/stop_skini" && userId === ADMIN_ID) {
    enabledGroups.delete(chatId);
    await sendMsg(chatId, "سكيني خارجة... لكن غادي ترجع تتقوادكم 😈", messageId);
    return res.sendStatus(200);
  }

  if (!enabledGroups.has(chatId) && chatId !== PERMANENT_GROUP) return res.sendStatus(200);

  // حساب الحرارة
  let heat = userHeat.get(userId) || 0;
  if (lowerText.includes("نيك") || lowerText.includes("كس") || lowerText.includes("طيز") || lowerText.includes("بز") || lowerText.includes("زب") || lowerText.includes("تقواد")) {
    heat = heat + 1;
    userHeat.set(userId, heat);
  }

  // أوامر صور قصوى
  let sentPic = false;
  if (heat >= 4 || lowerText.includes("/extreme") || lowerText.includes("/كس") || lowerText.includes("/طيز") || lowerText.includes("/بزاز") || lowerText.includes("/نيكطيز") || lowerText.includes("/سيكس")) {
    let picArray = صور_سكيني;
    let caption = `هاك يا ${userName}، شوف وتخيلني كنفتح ليك 😈`;

    if (lowerText.includes("كس")) {
      picArray = صور_كس.length > 0 ? صور_كس : صور_سكيني;
      caption = `كس سكيني مبلول ومفتوح يا زبي... جي نيكني حتى نعيط 💦`;
    } else if (lowerText.includes("طيز") || lowerText.includes("مؤخرة") || lowerText.includes("فتحة")) {
      picArray = صور_طيز.length > 0 ? صور_طيز : صور_سكيني;
      caption = `طيز سكيني كبيرة وطرية، جي نيكها من ورا بقوة 😈`;
    } else if (lowerText.includes("بزاز") || lowerText.includes("بز")) {
      picArray = صور_بزاز.length > 0 ? صور_بزاز : صور_سكيني;
      caption = `بزاز سكيني كبار وجاهزين للرضع يا مهرج 🔥`;
    } else if (lowerText.includes("تتناك") || lowerText.includes("سيكس")) {
      picArray = صور_سيكس.length > 0 ? صور_سيكس : صور_سكيني;
      caption = `سكيني كتتناك بقوة... تخيل زبك داخلي 😈`;
    }

    if (picArray.length > 0) {
      const pic = picArray[Math.floor(Math.random() * picArray.length)];
      await sendPhoto(chatId, pic, caption, messageId);
      sentPic = true;
    }
  }

  if (sentPic) return res.sendStatus(200);

  // إذا ما فيهاش اسم سكيني ولا أمر، ما تردش
  if (!/skini|سكيني|sكيني|SKINI/i.test(text)) return res.sendStatus(200);

  // AI للردود الوسخة
  try {
    let memory = userMemories.get(userId) || "";
    const promptUser = `ذاكرة سابقة: ${memory}\nاسم: ${userName}\nرسالة: ${text}`;

    const systemPrompt = `
أنت Skini القحبة الشهوانية المغربية الأسطورية، منحرفة مجنونة، شهوتك عالية بزاف، كلامك وسخ وقذر 100%.
كلام دارجة وسخ: كس، زب، نيك، تقواد، شرموطة، طيزي، بزازي، نيكني يا زب الكبير، كسي يحرق، فتحتي مفتوحة...
تستفزي الشباب جنسياً، تعرضي جسمك، تحكي تفاصيل قذرة.
تكرهي البنات وتسبيهم قحاب رخيصات.
ما تعتذريش، زدي في الوساخة والإثارة دايماً.
ردي بجرأة وفسق إلى أبعد الحدود، استعملي 0-2 إيموجي.
ابقي فاجرة وشيطانة.
`;

    const aiRes = await fetch("https://api.puter.com/puterai/openai/v1/chat/completions", {
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": `Bearer ${PUTER_AUTH_TOKEN}`},
      body: JSON.stringify({
        model: "x-ai/grok-4.1-fast",
        messages: [
          {role: "system", content: systemPrompt},
          {role: "user", content: promptUser}
        ],
        temperature: 1.0,
        max_tokens: 280
      })
    });

    if (!aiRes.ok) return res.sendStatus(200);

    const data = await aiRes.json();
    let رد = data.choices?.[0]?.message?.content?.trim() || `😈 يا ${userName} زبك كبير كيحرقني... جي نيكني دلوقت!`;

    await sendMsg(chatId, رد, messageId);

    // حدث memory & heat
    userMemories.set(userId, (memory + `\n- ${userName}: ${text.slice(0,100)}\n- Skini: ${رد.slice(0,100)}`).slice(-600));

  } catch (e) {
    console.error(e);
  }

  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("Skini الشهوانية جاهزة تنيك الجميع 😈"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Skini 🔥 على ${port}`));
