const axios = require('axios');
const fs = require('fs');
const { SpeechClient } = require('@google-cloud/speech');
const path = require('path');

const userDataFile = './userData.json';

// تحميل بيانات المستخدمين من الملف
function loadUserData() {
  try {
    if (fs.existsSync(userDataFile)) {
      const data = fs.readFileSync(userDataFile, 'utf8');
      return JSON.parse(data);
    }
    return { users: [] };
  } catch (error) {
    console.error('خطأ في تحميل بيانات المستخدم:', error);
    return { users: [] };
  }
}

// حفظ بيانات المستخدمين إلى الملف
function saveUserData(data) {
  try {
    fs.writeFileSync(userDataFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('خطأ في حفظ بيانات المستخدم:', error);
  }
}

// تحويل الصوت إلى نص باستخدام Google Cloud Speech-to-Text
async function convertSpeechToText(audioFilePath) {
  const client = new SpeechClient();
  const audio = {
    content: fs.readFileSync(audioFilePath).toString('base64'),
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'ar-SA', // اللغة العربية
  };

  try {
    const [response] = await client.recognize({ audio, config });
    return response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
  } catch (error) {
    console.error('خطأ في تحويل الصوت إلى نص:', error);
    return null;
  }
}

// تحديث بيانات المستخدم أو إضافتها
function updateUser(data, userId, updates) {
  let user = data.users.find(u => u.userId === userId);

  if (!user) {
    user = { userId, username: null, conversations: [], interests: [], timestamp: Date.now() };
    data.users.push(user);
  }

  Object.keys(updates).forEach(key => {
    if (key === 'conversation') {
      user.conversations.push({ prompt: updates.conversation, timestamp: Date.now() });
    } else if (key === 'interest') {
      user.interests.push(updates.interest);
    } else {
      user[key] = updates[key];
    }
  });

  user.timestamp = Date.now();
  saveUserData(data);
}

// معالجة السؤال عبر API
async function processQuestion(prompt, senderId, pageAccessToken, sendMessage) {
  const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-pro?q=${encodeURIComponent(prompt)}&uid=${senderId}`;

  try {
    const response = await axios.get(apiUrl);
    const text = response.data.response || 'لا توجد إجابة متاحة حاليًا.';
    sendMessage(senderId, { text: `🔍 الإجابة:\n${text}` }, pageAccessToken);
  } catch (error) {
    console.error('خطأ في استدعاء API:', error);
    sendMessage(senderId, { text: '❗ حدث خطأ أثناء الاتصال بالخادم. ❗' }, pageAccessToken);
  }
}

// تنفيذ الأوامر
async function execute(senderId, args, pageAccessToken, sendMessage, audioFilePath) {
  const data = loadUserData();
  const prompt = args.join(' ');

  // تحديث بيانات المستخدم إذا كان هناك اسم مستخدم
  if (args[0] && args[0].startsWith('@')) {
    const username = args[0].slice(1);
    updateUser(data, senderId, { username });
  }

  // تحويل الصوت إلى نص إذا كان هناك ملف صوتي
  if (audioFilePath) {
    const speechText = await convertSpeechToText(audioFilePath);
    if (speechText) {
      updateUser(data, senderId, {
        conversation: speechText,
        interest: 'سؤال عن Gemini Pro من خلال الصوت',
      });
      return processQuestion(speechText, senderId, pageAccessToken, sendMessage);
    } else {
      sendMessage(senderId, { text: '❗ لم يتمكن من تحويل الصوت إلى نص. ❗' }, pageAccessToken);
      return;
    }
  }

  // تحديث بيانات المستخدم بالمحادثة النصية
  updateUser(data, senderId, {
    conversation: prompt,
    interest: 'سؤال عن Gemini Pro',
  });

  // معالجة السؤال
  await processQuestion(prompt, senderId, pageAccessToken, sendMessage);
}

module.exports = {
  name: 'gpt4',
  description: 'اطرح سؤالًا لـ Gemini Pro باستخدام الصوت أو النص',
  author: 'Aljur Pogoy',
  execute,
};
