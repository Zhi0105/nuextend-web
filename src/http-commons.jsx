import axios from "axios";

let apiClient

if (import.meta.env.VITE_API_URL) {
    apiClient = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
        "Access-Control-Allow-Origin": "*", // Allow requests from any origin
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS", // Allow specified methods
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept", // Allow specified headers
        },
    });
}

export { apiClient };