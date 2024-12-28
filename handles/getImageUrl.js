const axios = require('axios');

const getImageUrl = async (event, token) => {
  const mid = event?.message?.reply_to?.mid;
  if (!mid) return null;
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: token }
    });
    return data?.data?.[0]?.image_data?.url || null;
  } catch (err) {
    console.error("Image URL fetch error:", err);
    return null;
  }
};

module.exports = { getImageUrl };
