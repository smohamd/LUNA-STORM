const fs = require('fs');
const path = require('path');
const axios = require('axios');

// معرف الفيسبوك الخاص بالمطور (استبدل بالمعرف الفعلي)
const developerId = '8579057645476105'; // معرف المطور

module.exports = {
  name: '55',
  description: 'إرسال رسالة نصية إلى جميع الدردشات المفتوحة على صفحة الفيسبوك.',
  usage: 'إرسال رسالة لجميع الدردشات [النص]',
  author: 'النظام',
  async execute(senderId, args, pageAccessToken) {
    // التحقق من أن المستخدم هو المطور
    if (senderId !== developerId) {
      return sendMessage(senderId, { text: '❌ أنت غير مصرح لك باستخدام هذا الأمر.' }, pageAccessToken);
    }

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

    // التحقق إذا كانت هناك دردشات مفتوحة
    if (!usersData.users || usersData.users.length === 0) {
      return sendMessage(senderId, { text: '❌ لا توجد دردشات مفتوحة لإرسال الرسالة إليها.' }, pageAccessToken);
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
