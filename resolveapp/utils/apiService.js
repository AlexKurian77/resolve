import { API_URL } from '@env';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Sends a generic message to the chatbot.
   * @param {string} message - The text message to send.
   * @param {Array} history - The chat history array.
   * @returns {Promise<Object>} - Resolves to { response: string }
   */
  async sendChat(message, history = []) {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  async analyzePdi(answers, score, level) {
    try {
      const response = await fetch(`${this.baseUrl}/analyze_pdi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, score, level }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing PDI:', error);
      throw error;
    }
  }

  // --- Community API Methods ---
  
  async _postRequest(endpoint, bodyData) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error in ${endpoint}:`, error);
      throw error;
    }
  }

  async upvotePost(threadId, postId, userId) {
    return this._postRequest('/api/community/threads/upvote', { threadId, postId, userId });
  }

  async addPost(threadId, post) {
    return this._postRequest('/api/community/threads/post', { threadId, post });
  }

  async addReply(threadId, postId, reply) {
    return this._postRequest('/api/community/threads/reply', { threadId, postId, reply });
  }

  async joinSession(sessionId, userId) {
    return this._postRequest('/api/community/sessions/join', { sessionId, userId });
  }

  async sendChatMessage(chatId, message) {
    return this._postRequest('/api/community/chats/message', { chatId, message });
  }

  /**
   * Starts the PDI Assessment sequence.
   */
  async startAssessment() {
    return this.sendChat("START_PDI_ASSESSMENT");
  }

  /**
   * Triggers the strong urges sequence.
   */
  async feelingUrges() {
    return this.sendChat("FEELING_URGES");
  }

  /**
   * Triggers the share progress sequence.
   */
  async shareProgress() {
    return this.sendChat("SHARE_PROGRESS");
  }
}

export const apiService = new ApiService();
