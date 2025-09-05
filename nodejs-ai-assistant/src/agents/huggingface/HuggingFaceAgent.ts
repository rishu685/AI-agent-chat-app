// Example: Free Hugging Face integration
// Add this to your .env file:
// HUGGINGFACE_API_KEY=your_hf_token_here

import axios from 'axios';

export class HuggingFaceAgent {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models/';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string, model = 'microsoft/DialoGPT-large') {
    try {
      const response = await axios.post(
        `${this.baseUrl}${model}`,
        {
          inputs: prompt,
          parameters: {
            max_length: 500,
            temperature: 0.7,
            do_sample: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data[0]?.generated_text || 'No response generated';
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }
}
