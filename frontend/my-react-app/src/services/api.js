// frontend/my-react-app/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Guard: error.config may be undefined in some network errors
        const originalRequest = error?.config;
        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                        refresh: refreshToken
                    });

                    const newAccessToken = response.data.access;
                    localStorage.setItem('access_token', newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.log('Refresh token failed, logging out');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                // navigate to login page
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (userData) => api.post('/auth/register/', userData),
    login: (credentials) => api.post('/auth/login/', credentials),
    getProfile: () => api.get('/auth/profile/'),
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};

// Execution API now sends inputs as well
export const executionAPI = {
    // inputs: optional array of strings to be provided to input() calls
    executeCode: (code, language = 'python', inputs = []) =>
        api.post('/execution/execute/', { code, language, inputs }),
};

export const assessmentAPI = {
    // Assessments
    getAssessments: () => api.get('/assessments/assessments/'),
    getAssessment: (id) => api.get(`/assessments/assessments/${id}/`),
    getAssessmentQuestions: (id) => api.get(`/assessments/assessments/${id}/questions/`),
    createAssessment: (data) => api.post('/assessments/assessments/', data),
    updateAssessment: (id, data) => api.put(`/assessments/assessments/${id}/`, data),
    deleteAssessment: (id) => api.delete(`/assessments/assessments/${id}/`),

    // Questions
    getQuestion: (id) => api.get(`/assessments/questions/${id}/`),
    createQuestion: (data) => api.post('/assessments/questions/', data),
    
    // Submissions
    getSubmissions: () => api.get('/assessments/submissions/'),
    createSubmission: (data) => api.post('/assessments/submissions/', data),
    getMySubmissions: () => api.get('/assessments/submissions/?my=true'),
}
export default api;