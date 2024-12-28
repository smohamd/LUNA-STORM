const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
  name: '55',
  description: 'إرسال رسالة نصية إلى جميع الدردشات المفتوحة على صفحة الفيسبوك.',
  usage: 'إرسال رسالة لجميع الدردشات [النص]',
  author: 'النظام',
  async execute(senderId, args, pageAccessToken) {
    // النص الذي سيتم إرساله لجميع الدردشات
    const messageText = args.join(' ');

    if (!messageText) {
      sendMessage(senderId, { text: '❌ يجب عليك تقديم النص الذي تريد إرساله لجميع الدردشات.' }, pageAccessToken);
      return;
    }

    // جلب قائمة الدردشات (مستخدمين) من ملف البيانات
    const usersFile = path.join(__dirname, '../userData.json');
    let usersData;

    try {
      if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile, 'utf8');
        usersData = JSON.parse(data);
      } else {
        sendMessage(senderId, { text: '❌ لم يتم العثور على بيانات المستخدمين.' }, pageAccessToken);
        return;
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات المستخدمين:', error);
      sendMessage(senderId, { text: '❌ حدث خطأ في تحميل بيانات المستخدمين.' }, pageAccessToken);
      return;
    }

    // إرسال الرسالة إلى جميع المستخدمين
    for (const user of usersData.users) {
      try {
        await sendMessage(user.userId, { text: messageText }, pageAccessToken);
      } catch (error) {
        console.error('خطأ في إرسال الرسالة للمستخدم:', user.userId, error);
      }
    }

    sendMessage(senderId, { text: `✅ تم إرسال الرسالة إلى جميع الدردشات بنجاح!` }, pageAccessToken);
  },
};

// دالة لإرسال رسالة إلى مستخدم
async function sendMessage(userId, message, pageAccessToken) {
  const url = `https://graph.facebook.com/v13.0/me/messages?access_token=${pageAccessToken}`;
  
  const payload = {
    messaging_type: 'UPDATE',
    recipient: { id: userId },
    message: message,
  };

  try {
    await axios.post(url, payload);
  } catch (error) {
    console.error('خطأ في إرسال الرسالة عبر API الفيسبوك:', error);
  }
}
