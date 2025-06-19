import axios from "axios";
import { Login, User } from "../../types/user";

axios.defaults.baseURL = "http://localhost:3003";

// export const register = async ({
//   lastName,
//   firstName,
//   email,
//   password,
//   confirmPassword,
// } : User) => {
//   const response = await axios.post("/users/register", {
//     lastName,
//     firstName,
//     email,
//     password,
//     confirmPassword,
//   });
// return response.data;
// };

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


// export const login = async (email, password) => {
//   const response = await axios.post("/api/user/login", {
//     email,
//     password,
//   });

//   return response.data;
// };

// export const getProfile = async (accessToken) => {
//   const response = await axios.get("/api/user/profile", {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return response.data;
// };

// export const getUsers = async (accessToken) => {
//   const response = await axios.get("/api/user/friends", {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return response.data;
// };

// export const updateUser = async (accessToken, body) => {
//   const response = await axios.put("/api/user", body, {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return response.data;
// };

// export const updateProfilePicture = async (accessToken, formData) => {
//   const response = await axios.put("/api/user/profile-picture", formData, {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return response.data;
// };

// export const createMessage = async (accessToken, { receiverId, content }) => {
//   const response = await axios.post(
//     "/api/message",
//     {
//       receiverId,
//       content,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     }
//   );

//   return response.data;
// };
// export const getMessages = async (accessToken) => {
//   const response = await axios.get("/api/message/", {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return response.data;
// };
