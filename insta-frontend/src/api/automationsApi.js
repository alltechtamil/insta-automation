import api from './api';

export const getAutomations = async (userId) => {
    const response = await api.get(`/automated-post?userId=${userId}`);
    console.log('response: ', response);
    return response.data;
};

export const createAutomation = async (automationData) => {
    const response = await api.post('/automated-post', automationData);
    return response.data;
};

export const updateAutomation = async ({ id, ...automationData }) => {
    const response = await api.put(`/automated-post/${id}`, automationData);
    return response.data;
};

export const deleteAutomation = async (id) => {
    await api.delete(`/automated-post/${id}`);
    return id;
};

export const toggleAutomationStatus = async (id) => {
    const response = await api.patch(`/automated-post/${id}/toggle`);
    return response.data;
};

export const getInstagramPosts = async () => {
    const response = await api.get('/media/details');
    return response.data.media.data;
};
