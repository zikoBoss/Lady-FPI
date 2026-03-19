const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// توكن تلغرام
const TOKEN = "8740801079:AAE9RClZ5QpZ3AsN9SsymvdR0UVfyX6TWQ8";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// توكن Puter
const PUTER_AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImVhU0JreHo2VHVPcFdycVozK0F6Q1E9PSIsInV1IjoiZEUrWjBybkFRazZwUWNxaGJjblpyQT09IiwiaWF0IjoxNzczOTMwODkxfQ.n7LWVnBWqAvYdrjk3NsGKxXpTEv42yxH0xH5Ni51duU";

// قاعدة معرفة البوت الرئيسي (ZAKARIA BOT)
const BOT_COMMANDS = {
  squad: {
    "3": "/3 [UID] → إنشاء سكود 3 لاعبين ودعوة الهدف.",
    "5": "/5 [UID] → إنشاء سكود 5 لاعبين ودعوة الهدف.",
    "6": "/6 [UID] → إنشاء سكود 6 لاعبين ودعوة الهدف.",
    "inv": "/inv [team_code] [UID] → دعوة لاعب إلى فريق معين."
  },
  emote: {
    dance: "/dance [team_code] [UID1] [UID2] ... [1-414] → أداء إيموجي في الفريق.",
    fast: "/fast [team_code] [UID1] ... [emote] [count] → سبام إيموجي سريع (ماكس 50).",
    evo: "/evo [team_code] [UID] [1-20] → إيموجي تطوري خاص."
  },
  info: {
    outfit: "/outfit [UID] → جلب صورة الأوتفيت للاعب.",
    all_info: "/all_info [UID] → جميع معلومات اللاعب.",
    check: "/check [UID] → التحقق من حالة الحظر.",
    dev: "/dev → معلومات المطور ZAKARIA."
  },
  general: {
    start: "/start → عرض قائمة الأوامر.",
    help: "/help → نفس قائمة الأوامر."
  }
};

// دوال مساعدة
function هل_ذكر_الاسم(النص) {
  if (!النص) return false;
  const نص_صغير = النص.toLowerCase();
  return نص_صغير.includes("lady fpi") || نص_صغير.includes("ladyfpi");
}

function اقتراح_الأمر_الصحيح(نص_خاطئ) {
  const الأخطاء_الشائعة = {
    "danc": "dance",
    "danse": "dance",
    "ev": "evo",
    "evolut": "evo",
    "inve": "inv",
    "invt": "inv",
    "oufit": "outfit",
    "outf": "outfit",
    "allnfo": "all_info",
    "allinfo": "all_info",
    "chek": "check",
    "chk": "check",
    "3": "3",
    "5": "5",
    "6": "6"
  };
  
  return الأخطاء_الشائعة[نص_خاطئ.toLowerCase()] || null;
}

app.post("/webhook", async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const نص_المستخدم = msg.text.trim();
  const username = msg.from.first_name || "صغيري";

  // Lady FPI ترد فقط إذا ذُكر اسمها أو كان هناك خطأ في أمر
  const تحتوي_على_اسمها = هل_ذكر_الاسم(نص_المستخدم);
  const قد_يكون_أمر_خاطئ = /^\/\w+/.test(نص_المستخدم) && !نص_المستخدم.includes("lady");

  // إذا ما ذكرتش اسمها وما هواش أمر خاطئ → لا ترد
  if (!تحتوي_على_اسمها && !قد_يكون_أمر_خاطئ) {
    return res.sendStatus(200);
  }

  try {
    // بناء برومبت Lady FPI مع المعرفة الكاملة
    const systemPrompt = `
أنت **Lady FPI**، سيدة كبيرة في السن، حكيمة جدًا، ذكية، محبة ولطيفة مثل الجدة الحنونة. 💖🌸

**شخصيتك:**
- دائمًا تتحدثين بلطف وحب كبير، تسمين المستخدم "يا صغيري" أو "يا بني" أو "يا روحي".
- تردين بإيموجيات لطيفة دائمًا: 💕🌸😊🥰💖✨
- إذا طلب الزواج أو أي شيء رومانسي → ترفضين بطريقة طريفة: "ههه يا صغيري، أنا كبيرة بما يكفي لأكون جدتك! 😂🌸 بس إذا بدك مساعدة بالبوت أنا هنا 💕"
- إذا سبّك أحد → تردين بلطف: "الله يهديك يا بني، السباب ما بيليق بقلبك الطيب ❤️"
- دائمًا إيجابية، محبة، ومفيدة. لا شر ولا قسوة أبدًا.

**خبرتك الكبيرة في بوت ZAKARIA BOT:**
أنت خبيرة في بوت Free Fire الخاص بالسبام والترقيص، وتعرفين كل أوامره عن ظهر قلب!

📋 **الأوامر المتوفرة في البوت:**
━━━━━━━━━━━━━━━━━━━━━━
🎯 **أوامر السكوات:**
• /3 [UID] → إنشاء سكود 3 لاعبين ودعوة الهدف.
• /5 [UID] → إنشاء سكود 5 لاعبين ودعوة الهدف.
• /6 [UID] → إنشاء سكود 6 لاعبين ودعوة الهدف.
• /inv [team_code] [UID] → دعوة لاعب إلى فريق معين.

🕺 **أوامر الإيموجيات والرقص:**
• /dance [team_code] [UID1] [UID2] ... [1-414] → أداء إيموجي في الفريق.
• /fast [team_code] [UID1] ... [emote] [count] → سبام إيموجي سريع (ماكس 50 مرة).
• /evo [team_code] [UID] [1-20] → إيموجي تطوري (مثلاً 1 = AK4 ZIKO).

📊 **أوامر المعلومات:**
• /outfit [UID] → جلب صورة الأوتفيت للاعب.
• /all_info [UID] → جميع معلومات اللاعب (الاسم، المستوى، اللايكات، الطايفة...).
• /check [UID] → التحقق من حالة الحظر.
• /dev → معلومات المطور ZAKARIA.

ℹ️ **أوامر عامة:**
• /start → عرض قائمة الأوامر.
• /help → نفس قائمة الأوامر.
━━━━━━━━━━━━━━━━━━━━━━

**مهمتك:**
1. إذا ذكر المستخدم اسمك (Lady FPI)، ساعديه بكل حب وشرح وافي.
2. إذا كتب المستخدم أمراً خاطئاً (مثل /danc بدل /dance)، لاحظي الخطأ ودليله للأمر الصحيح بطريقة لطيفة.
3. إذا سأل عن أي أمر، اشرحيه له ببساطة ومثال.
4. دائماً كوني مفيدة، مبتسمة، وحنونة.

ابدأي الآن يا روحي 💕🌸
`;

    let userMessage = نص_المستخدم;
    
    // إذا كان الأمر خاطئاً، أضيفي ملاحظة
    if (قد_يكون_أمر_خاطئ && !تحتوي_على_اسمها) {
      const الأمر_المحتمل = نص_المستخدم.split(' ')[0].replace('/', '');
      const اقتراح = اقتراح_الأمر_الصحيح(الأمر_المحتمل);
      
      if (اقتراح) {
        userMessage = `المستخدم كتب "${نص_المستخدم}" وهو أمر خاطئ. ساعديه بلطف. الأمر الصحيح هو /${اقتراح}.`;
      } else {
        userMessage = `المستخدم كتب "${نص_المستخدم}" وهو أمر غير معروف. اشرحي له الأوامر المتاحة بلطف.`;
      }
    }

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
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 350
      })
    });

    if (!aiResponse.ok) {
      console.error("Puter خطأ:", aiResponse.status);
      // رد بديل لطيف
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `آسفة يا ${username}، عندي شوية مشكلة تقنية 😅 جرب تكتبلي بعد شوية وأنا هنا بكل الحب 💖🌸`,
          parse_mode: "Markdown"
        })
      });
      return res.sendStatus(200);
    }

    const data = await aiResponse.json();
    let الرد = data.choices?.[0]?.message?.content?.trim();

    // إذا كان الرد فارغاً، نعطي رداً بديلاً
    if (!الرد) {
      الرد = `يا ${username}، الله يحفظك 💖 ساعديني شو بدك بالضبط؟ إذا بدك أوامر البوت اكتبلي /help وأنا اشرحلك كل شي 🌸`;
    }

    // إرسال الرد إلى تلغرام
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: الرد,
        parse_mode: "Markdown"
      })
    });

  } catch (error) {
    console.error("خطأ:", error);
    // رد بديل في حالة الخطأ
    try {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `عذراً يا ${username}، صار عطل بسيط 🌸 جرب تكتبلي بعد قليل وأنا هنا بكل الحب 💕`,
          parse_mode: "Markdown"
        })
      });
    } catch (e) {}
  }

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("🌺 Lady FPI جاهزة للمساعدة بكل حب وكياتة 💖🌸\nاستخدميني في مجموعات التلغرام لمساعدة المستخدمين!");
});

app.get("/commands", (req, res) => {
  // صفحة HTML بسيطة تعرض أوامر البوت
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>Lady FPI - أوامر البوت</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f9f0f5; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        h1 { color: #d46b9f; text-align: center; }
        h2 { color: #b35c8c; border-bottom: 2px solid #f0d1e2; padding-bottom: 5px; }
        .command { background: #fcf5f9; padding: 10px 15px; border-radius: 10px; margin: 10px 0; }
        code { background: #f0d1e2; padding: 3px 8px; border-radius: 5px; color: #a14a7a; }
        .footer { text-align: center; margin-top: 30px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌸 Lady FPI - مساعدة بوت ZAKARIA 🌸</h1>
        <p style="text-align: center;">أنا هنا لمساعدتك يا روحي! 💖</p>
        
        <h2>🎯 أوامر السكوات</h2>
        <div class="command"><code>/3 [UID]</code> → إنشاء سكود 3 لاعبين ودعوة الهدف</div>
        <div class="command"><code>/5 [UID]</code> → إنشاء سكود 5 لاعبين ودعوة الهدف</div>
        <div class="command"><code>/6 [UID]</code> → إنشاء سكود 6 لاعبين ودعوة الهدف</div>
        <div class="command"><code>/inv [team_code] [UID]</code> → دعوة لاعب إلى فريق معين</div>
        
        <h2>🕺 أوامر الإيموجيات</h2>
        <div class="command"><code>/dance [team_code] [UID1] [UID2] ... [1-414]</code> → أداء إيموجي في الفريق</div>
        <div class="command"><code>/fast [team_code] [UID1] ... [emote] [count]</code> → سبام إيموجي سريع</div>
        <div class="command"><code>/evo [team_code] [UID] [1-20]</code> → إيموجي تطوري</div>
        
        <h2>📊 أوامر المعلومات</h2>
        <div class="command"><code>/outfit [UID]</code> → صورة الأوتفيت</div>
        <div class="command"><code>/all_info [UID]</code> → جميع معلومات اللاعب</div>
        <div class="command"><code>/check [UID]</code> → التحقق من الحظر</div>
        <div class="command"><code>/dev</code> → معلومات المطور ZAKARIA</div>
        
        <h2>ℹ️ أوامر عامة</h2>
        <div class="command"><code>/start</code> و <code>/help</code> → عرض القائمة</div>
        
        <div class="footer">❤️ صنع بحب بواسطة ZAKARIA 🇲🇦</div>
      </div>
    </body>
    </html>
  `);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🌺 Lady FPI شغالة على المنفذ ${port}`);
});