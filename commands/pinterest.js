const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');
const replies = {}; 

module.exports = {
  name: 'صور',
  description: 'جلب صور من Pinterest 📸✨',
  author: '404',
  usage: 'pinterest <كلمة البحث>',

  async execute(senderId, args) {
    const pageAccessToken = token;

    if (!args || args.length < 1) {
      return await sendMessage(senderId, { text: '🔍 اكتب محتوى لبحث ' }, pageAccessToken);
    }

    const searchTerm = args[0];
    const numImages = 6; // عدد الصور الثابت (6 صور)

    const apiUrl = `https://pin-kshitiz.vercel.app/pin?search=${encodeURIComponent(searchTerm)}`;

    try {
      const { data } = await axios.get(apiUrl);
      const images = data.result.slice(0, numImages);

      if (images.length > 0) {
        await sendMessage(senderId, { text: `✅ تم العثور على ${images.length} صورة مذهلة للبحث عن "${searchTerm}"! 🌟` }, pageAccessToken);
        for (const imageUrl of images) {
          await sendMessage(senderId, { attachment: { type: 'image', payload: { url: imageUrl } } }, pageAccessToken);
        }
        await sendMessage(senderId, { text: '📥 تم إرسال الصور إلى محادثتك!\nهل ترغب في المزيد؟ 😊 اكتب "نعم" لإرسال المزيد!\n ميزة متوقف حالين نتاسف للامر  ' }, pageAccessToken);

        // تخزين الرد في انتظار "نعم"
        replies[senderId] = { waitingForMore: true };
      } else {
        await sendMessage(senderId, { text: '❌لم يتم العثور على صور لهذا البحث، حاول مرة أخرى بكلمة مختلفة 🤔' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      await sendMessage(senderId, { text: 'حدث خطأ أثناء جلب الصور، يرجى المحاولة لاحقًا' }, pageAccessToken);
    }
  },

  // Webhook لمعالجة الردود بعد أن يرسل المستخدم "نعم"
  async handleWebhook(req, res) {
    const data = req.body;
    const senderId = data.entry[0].messaging[0].sender.id;
    const messageText = data.entry[0].messaging[0].message.text;

    if (replies[senderId] && replies[senderId].waitingForMore && messageText.toLowerCase() === 'نعم') {
      const searchTerm = 'الصور السابقة'; // يمكنك تخزين كلمة البحث السابقة
      const numImages = 6;

      const apiUrl = `https://pin-kshitiz.vercel.app/pin?search=${encodeURIComponent(searchTerm)}`;

      try {
        const { data } = await axios.get(apiUrl);
        const images = data.result.slice(0, numImages);

        if (images.length > 0) {
          await sendMessage(senderId, { text: `✅ تم العثور على المزيد من الصور للبحث عن "${searchTerm}"! 🌟` }, pageAccessToken);
          for (const imageUrl of images) {
            await sendMessage(senderId, { attachment: { type: 'image', payload: { url: imageUrl } } }, pageAccessToken);
          }
          await sendMessage(senderId, { text: '📥 تم إرسال المزيد من الصور إلى محادثتك!' }, pageAccessToken);
        } else {
          await sendMessage(senderId, { text: '❌لم يتم العثور على صور أخرى لهذا البحث، حاول كلمة مختلفة 🤔' }, pageAccessToken);
        }
      } catch (error) {
        console.error('Error fetching more images:', error);
        await sendMessage(senderId, { text: 'حدث خطأ أثناء جلب المزيد من الصور، يرجى المحاولة لاحقًا' }, pageAccessToken);
      }

      // مسح حالة الانتظار بعد الرد
      delete replies[senderId];
    }

    res.sendStatus(200);
  }
};
