import axios from "axios";
import { Login, User } from "../../types/user";

// Use NEXT_PUBLIC_API_URL environment variable, with a fallback for local development
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export const register = async (user: User) => {
  const { data } = await axios.post("/users/register", user);
  return data;
};
export const login = async (user: Login) => {
  const { data } = await axios.post("/users/login", user);
  return data;
};

export const updateUser = async (accessToken: string, body: Partial<User>) => {
  const response = await axios.put("/users/update", body, { // Corrected URL
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

export const updateProfilePicture = async (accessToken : string, formData : FormData) => {
  const response = await axios.put("/users/update-profile-picture", formData, { // Corrected URL
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};


export const getUsers = async (accessToken: string) => {
  const response = await axios.get("/users", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};


// Renamed parameter for clarity, matching controller's expectation
export const getMessagesForChat = async (accessToken: string, partnerId: string) => {
  const response = await axios.get(`/messages/${partnerId}`, { // Pass partnerId in the URL
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};
