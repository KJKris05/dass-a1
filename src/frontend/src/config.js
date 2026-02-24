// API configuration
import axios from 'axios';

// Use environment variable in production, localhost in development
const API_URL = process.env.REACT_APP_API_URL

// Create axios instance with base URL
export const api = axios.create({
    baseURL: API_URL
});

// Export the base URL for direct usage
export default API_URL;
