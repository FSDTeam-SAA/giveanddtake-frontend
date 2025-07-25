/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const session = await getSession();
        const TOKEN = session?.accessToken;
        if (TOKEN) {
            config.headers.Authorization = `Bearer ${TOKEN}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);



// Create Resume API
export async function createResume(data: any) {
    const response = await api.post("/create-resume/create-resume", data);
    return response.data;
}