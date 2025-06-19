export type User = {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePicture: string;
  status: string;
} | null;

export type Login = {
  email: string;
  password: string;
};
