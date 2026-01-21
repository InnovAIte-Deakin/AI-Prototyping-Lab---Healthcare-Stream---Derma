import axios from "axios";

// Dedicated client for anonymous/public flows. Do NOT attach auth headers.
export const publicApiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});
