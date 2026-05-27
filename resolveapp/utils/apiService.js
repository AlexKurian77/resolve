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
