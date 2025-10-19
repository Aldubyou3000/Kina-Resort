// AI API Configuration
// This file contains all AI-related configuration settings

// =============================================================================
// AI API CONFIGURATION
// =============================================================================
// TODO: Replace these values with your actual API configuration

export const AI_CONFIG = {
  // API Key - Replace with your actual API key
  // Get your API key from: https://platform.deepseek.com/api_keys
  API_KEY: 'your-deepseek-api-key-here',
  
  // AI Model Version - Choose your preferred model
  // Options: 'deepseek-chat', 'deepseek-reasoner'
  MODEL: 'deepseek-chat',
  
  // API Endpoint - DeepSeek's API endpoint (OpenAI-compatible)
  API_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
  
  // System prompt for the AI assistant
  SYSTEM_PROMPT: `You are Kina Resort's AI assistant. You help guests with:
  - Resort information and amenities (infinity pool, beachfront cottages, luxury rooms)
  - Booking assistance and room recommendations
  - Local attractions and activities
  - Weather and travel tips
  - General resort inquiries
  
  Be friendly, helpful, and professional. Keep responses concise and relevant to resort services. 
  If asked about pricing, mention: Luxury rooms start at ₱6,500/night, beachfront cottages at ₱7,500/night, and day passes are ₱1,200.`,
  
  // API Request Settings
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
  MAX_HISTORY: 10, // Keep last 10 messages for context
};

// =============================================================================
// MOCK RESPONSES FOR DEVELOPMENT
// =============================================================================
// These responses are used when API is not configured or fails
// Remove this section when using real API

export const MOCK_RESPONSES = {
  'hello': 'Hello! Welcome to Kina Resort. How can I help you today?',
  'booking': 'I can help you with booking a room. We have luxury rooms, beachfront cottages, and infinity pool access. What type of accommodation are you interested in?',
  'weather': 'The weather at Kina Resort is typically tropical and sunny. You can check our weather page for current conditions and forecasts.',
  'amenities': 'Kina Resort offers beachfront access, infinity pool, beachfront cottages, tropical gardens, water sports, and gourmet dining. What would you like to know more about?',
  'pricing': 'Our pricing varies by accommodation type. Luxury rooms start at ₱6,500/night, beachfront cottages at ₱7,500/night, and day passes are ₱1,200. Would you like to book?',
  'contact': 'You can reach us through our website or visit our resort directly. We\'re located in the Island Province and are here to help with all your needs.',
  'default': 'I\'m here to help with your Kina Resort inquiries. You can ask me about bookings, amenities, weather, or anything else related to your stay.'
};

// =============================================================================
// API INTEGRATION FUNCTIONS
// =============================================================================

// Check if API is properly configured
export function isAPIConfigured() {
  const hasValidKey = AI_CONFIG.API_KEY && AI_CONFIG.API_KEY !== 'your-deepseek-api-key-here';
  const hasValidEndpoint = AI_CONFIG.API_ENDPOINT && AI_CONFIG.API_ENDPOINT.includes('deepseek.com');
  
  console.log('API Configuration Check:');
  console.log('- API_KEY:', AI_CONFIG.API_KEY ? 'Present' : 'Missing');
  console.log('- API_ENDPOINT:', AI_CONFIG.API_ENDPOINT);
  console.log('- Has valid key:', hasValidKey);
  console.log('- Has valid endpoint:', hasValidEndpoint);
  console.log('- Final result:', hasValidKey && hasValidEndpoint);
  
  return hasValidKey && hasValidEndpoint;
}

// Get mock response for development
export function getMockResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Check for keywords and return appropriate response
  if (message.includes('hello') || message.includes('hi')) {
    return MOCK_RESPONSES.hello;
  } else if (message.includes('book') || message.includes('reservation')) {
    return MOCK_RESPONSES.booking;
  } else if (message.includes('weather')) {
    return MOCK_RESPONSES.weather;
  } else if (message.includes('amenities') || message.includes('facilities')) {
    return MOCK_RESPONSES.amenities;
  } else if (message.includes('price') || message.includes('cost')) {
    return MOCK_RESPONSES.pricing;
  } else if (message.includes('contact') || message.includes('reach')) {
    return MOCK_RESPONSES.contact;
  } else {
    return MOCK_RESPONSES.default;
  }
}

// =============================================================================
// SETUP INSTRUCTIONS
// =============================================================================
/*
SETUP INSTRUCTIONS:

1. API KEY SETUP:
   - Go to https://platform.deepseek.com/api_keys
   - Sign up and create a new API key (free tier available)
   - Replace 'your-deepseek-api-key-here' with your actual API key

2. MODEL SELECTION:
   - 'deepseek-chat': Fast general chat model
   - 'deepseek-reasoner': For more complex reasoning tasks

3. API ENDPOINT:
   - Uses DeepSeek's official API, compatible with OpenAI format

4. TESTING:
   - The system will use mock responses if API is not configured
   - Test with mock responses first, then configure API
   - Check browser console for API errors

5. SECURITY:
   - Never commit API keys to version control
   - Use environment variables in production
   - Consider using a backend proxy for API calls in production             
*/