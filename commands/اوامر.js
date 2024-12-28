const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'مساعدة',
  description: 'عرض الأوامر المتاحة 🛠️',
  usage: 'مساعدة\nمساعدة [اسم الأمر]',
  author: 'النظام',
  execute(senderId, args, pageAccessToken) {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const commandFile = commandFiles.find(file => {
        const command = require(path.join(commandsDir, file));
        return command.name.toLowerCase() === commandName;
      });

      if (commandFile) {
        const command = require(path.join(commandsDir, commandFile));
        const commandDetails = `
━━━━━━━━━━━━━━━━
🌟 مرحبًا بك! 🌟
📜 اسم الأمر: ${command.name}
📝 الوصف: ${command.description}
📋 كيفية الاستخدام: ${command.usage}
━━━━━━━━━━━━━━━━`;

        sendMessage(senderId, { text: commandDetails }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: `❌ **عذرًا! الأمر "${commandName}" غير موجود.**` }, pageAccessToken);
      }
      return;
    }

    const commands = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return `│ - ${command.name}     ⚙🧬💻`;
    });

    const helpMessage = `
━━━━━━━━━━━━━━━━
💡 مرحبًا بك في نظام الأوامر 🎉
💬 الأوامر المتاحة لديك:
╭─╼━━━━━━━━╾─╮
${commands.join('\n')}
╰─━━━━━━━━━╾─╯
✍️ لعرض تفاصيل أي أمر، اكتب -مساعدة [اسم الأمر]
━━━━━━━━━━━━━━━━`;

    sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};
