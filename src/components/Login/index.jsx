import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./index.css";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON, got: ${text}`);
      }

      const result = await response.json();

      if (response.ok) {
        console.log("Login successful:", result);
        localStorage.setItem("token", result.token);
        let usertype = "user";
        try {
          const response = await fetch("http://localhost:5000/me", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${result.token}`,
            },
          });
          const resultuser = await response.json();
          console.log(resultuser);
          usertype = resultuser.user.role;
        } catch (error) {
          console.log(error.messsage);
        }
        window.location.href = `${usertype}/product`;
      } else {
        alert("Login failed: " + result.message);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert(error.message || "Something went wrong.");
    }
  };

  return (
    <div className="h-[90vh] flex flex-row justify-center items-center">
      <div className="login-form-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>?,./\\|`~]).{8,}$/,
                  message:
                    "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
                },
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="error">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
