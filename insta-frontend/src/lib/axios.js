// src/lib/axios.js
import axios from 'axios';
import { BACKEND_API_URL } from '../config/envConfig';

const instance = axios.create({
    baseURL: BACKEND_API_URL,
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default instance;
