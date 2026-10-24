import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

// Create a configured axios instance (or reuse if you have a shared one)
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const subscribeToNewsletter = async (email: string, source: string = 'unknown') => {
    try {
        const response = await api.post('/newsletter/subscribe', {
            email,
            source,
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Subscription failed');
        }
        throw new Error('Network error or server unavailable');
    }
};
