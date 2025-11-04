// frontend/src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://hostel-complaint-system-1-5ez7.onrender.com/api",

});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
