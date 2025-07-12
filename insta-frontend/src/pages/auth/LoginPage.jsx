// src/pages/auth/LoginPage.jsx
import React from 'react';
import { Button } from 'antd';
import { BACKEND_API_URL } from '../../config/envConfig';

const LoginPage = () => {
    const handleLogin = () => {
        window.location.href = `${BACKEND_API_URL}/auth/login`;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white shadow-lg rounded-lg p-10 w-80 text-center">
                <h1 className="text-2xl font-bold mb-6">Login with Instagram</h1>
                <Button onClick={handleLogin} className="w-full bg-pink-500 text-white">
                    Connect Instagram
                </Button>
            </div>
        </div>
    );
};

export default LoginPage;
