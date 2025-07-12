// src/redux/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    token: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthToken(state, action) {
            state.token = action.payload;
            state.isAuthenticated = true;
        },
        logout(state) {
            state.token = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setAuthToken, logout } = authSlice.actions;
export default authSlice.reducer;
