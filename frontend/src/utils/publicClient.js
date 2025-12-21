import axios from "axios";

// Dedicated client for anonymous/public flows. Do NOT attach auth headers.
export const publicApiClient = axios.create({
  baseURL: 'http://localhost:8000',
});
