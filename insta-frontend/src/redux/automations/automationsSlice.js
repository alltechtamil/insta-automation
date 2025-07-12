import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as automationsApi from '../../api/automationsApi';
import toast from 'react-hot-toast';

// Thunks
export const fetchAutomations = createAsyncThunk(
    'automations/fetchAutomations',
    async (userId, { rejectWithValue }) => {
        try {
            return await automationsApi.getAutomations(userId);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createAutomation = createAsyncThunk(
    'automations/createAutomation',
    async (automationData, { rejectWithValue }) => {
        try {
            const newAutomation = await automationsApi.createAutomation(automationData);
            toast.success('Automation created successfully!');
            return newAutomation;
        } catch (error) {
            toast.error(error.response?.data.error || 'Failed to create automation.');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateAutomation = createAsyncThunk(
    'automations/updateAutomation',
    async (automationData, { rejectWithValue }) => {
        try {
            const updated = await automationsApi.updateAutomation(automationData);
            toast.success('Automation updated successfully!');
            return updated;
        } catch (error) {
            toast.error(error.response?.data.error || 'Failed to update automation.');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteAutomation = createAsyncThunk(
    'automations/deleteAutomation',
    async (id, { rejectWithValue }) => {
        try {
            await automationsApi.deleteAutomation(id);
            toast.success('Automation deleted successfully!');
            return id;
        } catch (error) {
            toast.error(error.response?.data.error || 'Failed to delete automation.');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const toggleAutomationStatus = createAsyncThunk(
    'automations/toggleAutomationStatus',
    async (id, { rejectWithValue }) => {
        try {
            return await automationsApi.toggleAutomationStatus(id);
        } catch (error) {
            toast.error(error.response?.data.error || 'Failed to toggle status.');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Slice
const initialState = {
    items: [],
    status: 'idle',
    error: null,
};

const automationsSlice = createSlice({
    name: 'automations',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAutomations.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAutomations.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchAutomations.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(createAutomation.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(updateAutomation.fulfilled, (state, action) => {
                const idx = state.items.findIndex(item => item._id === action.payload._id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(deleteAutomation.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item._id !== action.payload);
            })
            .addCase(toggleAutomationStatus.fulfilled, (state, action) => {
                const idx = state.items.findIndex(item => item._id === action.payload.id);
                if (idx !== -1) state.items[idx].isEnabled = action.payload.isEnabled;
            });
    },
});

export const automationsReducer = automationsSlice.reducer;
