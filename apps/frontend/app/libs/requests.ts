import axios from "axios";
import { Login, User } from "../../types/user";

axios.defaults.baseURL = "http://localhost:3003";

export const register = async (user: User) => {
  const { data } = await axios.post("/users/register", user);
  return data;
};
export const login = async (user: Login) => {
  const { data } = await axios.post("/users/login", user);
  return data;
};

export const updateUser = async (accessToken: string, body: Partial<User>) => {
  const response = await axios.put("/api/user", body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

export const updateProfilePicture = async (accessToken : string, formData : FormData) => {
  const response = await axios.put("/api/user/profile-picture", formData, {
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


export const getMessages = async (accessToken: string) => {
  const response = await axios.get("messages", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};
