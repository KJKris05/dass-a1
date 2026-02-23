// API configuration
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with base URL
export const api = axios.create({
    baseURL: API_URL
});

export default API_URL;
