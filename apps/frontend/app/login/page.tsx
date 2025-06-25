"use client";

import { Store } from "../libs/globalState";
import { useFormik } from "formik";
import Image from "next/image";
import * as Yup from "yup";
import logoHsoub from "../../public/hsoub.png";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../libs/requests";
import { useMutation } from "@tanstack/react-query";
import ErrorMessage from "../_components/ErrorMessage";

export default function Register() {
  const { setUser, setAccessToken } = Store();
  const router = useRouter();

  const { mutate: LoginUser } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      document.cookie = `token=${data.accessToken}; path=/;`;
      router.push("/");
    },
    onError: (error: any) => {
      console.log(error?.message || "Registration failed");
    },
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validateOnBlur: false,
    validateOnChange: false,
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .required("Password is required")
        .min(8, "Password must be at least 8 characters")
        .required("Confirm Password is required")
        .oneOf([Yup.ref("password")], "Passwords must match"),
    }),
    onSubmit: (values) => {
      LoginUser(values);
    },
  });

  // const errors = Object.values(formik.errors);
  // if (errors.length > 0) {
  //   alert(errors.join("\n"));
  // }

  return (
    <div className="h-screen bg-bg-primary">
      <div className="flex flex-col space-y-8 justify-center h-full max-w-lg mx-auto px-8">
        <Image src={logoHsoub} alt="logo" className="w-64 mx-auto" />
        <form onSubmit={formik.handleSubmit}>
          <input
            type="text"
            id="email"
            placeholder="Email"
            className="w-full p-3 rounded-md bg-bg-secondary mb-4 text-white"
            value={formik.values.email}
            onChange={formik.handleChange}
          />
          <ErrorMessage message={formik.errors.email} />
          <input
            type="password"
            id="password"
            placeholder="Password"
            className="w-full p-3 rounded-md bg-bg-secondary mb-4 text-white"
            value={formik.values.password}
            onChange={formik.handleChange}
          />
          <ErrorMessage message={formik.errors.password} />
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-md text-white font-semibold"
          >
            Login
          </button>
          <div className="mt-2 space-x-2">
            <span className="text-white">Already have an account? </span>
            <Link href="/register" className="text-blue-500">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
