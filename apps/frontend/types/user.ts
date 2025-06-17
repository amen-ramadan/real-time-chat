export type User = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type Login = {
  email: string;
  password: string;
};
