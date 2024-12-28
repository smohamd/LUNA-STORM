const axios = require('axios');
const path = require('path');

// Helper function for POST requests
const axiosPost = (url, data, params = {}) => axios.post(url, data, { params }).then(res => res.data);

// Send a message with typing indicators
const sendMessage = async (senderId, { text = '', attachment = null }, pageAccessToken) => {
  if (!text && !attachment) {
    console.error('No content to send.');
    return;
  }

  const url = `https://graph.facebook.com/v21.0/me/messages`;
  const params = { access_token: pageAccessToken };

  try {
    console.log(`Sending message to user ID: ${senderId}`);

    // Turn on typing indicator
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_on" }, params);

    // Prepare message payload
    const messagePayload = {
      recipient: { id: senderId },
      message: {}
    };

    if (text) {
      messagePayload.message.text = text;
    }

    if (attachment) {
      messagePayload.message.attachment = {
        type: attachment.type,
        payload: {
          url: attachment.payload.url,
          is_reusable: true
        }
      };
    }

    // Send the message
    await axiosPost(url, messagePayload, params);

    // Turn off typing indicator
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_off" }, params);

    console.log(`Message sent successfully to user ID: ${senderId}`);
  } catch (e) {
    // Log detailed error message
    const errorMessage = e.response?.data?.error?.message || e.message;
    if (e.response) {
      console.error(`Error status: ${e.response.status}, Message: ${errorMessage}`);
    } else {
      console.error(`Unexpected error: ${errorMessage}`);
    }
  }
};

module.exports = { sendMessage };
