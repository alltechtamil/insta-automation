import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/auth/authSlice';
import { BACKEND_API_URL } from '../config/envConfig';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: BACKEND_API_URL,
});

// Request interceptor to add the token to every request
api.interceptors.request.use(
    (config) => {
        // The token is read just before the request is sent
        const token = store.getState().auth.token;
        console.log('token: ', token);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// NEW: Response interceptor for handling global errors
api.interceptors.response.use(
    (response) => {
        // If the request was successful, just return the response
        return response;
    },
    (error) => {
        // Check if the error is a 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Dispatch the logout action to clear the redux state and local storage
            store.dispatch(logout());

            // Display a toast message to the user
            toast.error("Your session has expired. Please log in again.");

            // Perform a hard redirect to the login page to ensure a clean state
            // This is often more reliable than using a router's navigate function in this context.
            window.location.href = '/';
        }

        // For any other error, just reject the promise so it can be handled locally
        return Promise.reject(error);
    }
);


export default api;