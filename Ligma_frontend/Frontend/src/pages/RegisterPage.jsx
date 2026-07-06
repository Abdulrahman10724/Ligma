import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerUser } from "../redux/authSlice";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values) => {
    const result = await dispatch(registerUser(values));
    if (registerUser.fulfilled.match(result)) {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] px-4 text-[color:var(--text-primary)]">
      <div className="w-full max-w-md p-8 bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-2xl shadow-sm">
        <h2 className="text-3xl font-bold mb-3 text-center text-[color:var(--accent)]">Create account</h2>
        <p className="text-sm text-center mb-6 text-[color:var(--text-secondary)]">Join LIGMA and collaborate in real time</p>
        {error ? <p className="mb-4 rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 px-3 py-2 text-sm text-[color:var(--danger)]">{error}</p> : null}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input
              type="text"
              placeholder="Full name"
              className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)]"
              {...register("name")}
              disabled={loading}
            />
            {errors.name ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.name.message}</p> : null}
          </div>
          <div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)]"
              {...register("email")}
              disabled={loading}
            />
            {errors.email ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.email.message}</p> : null}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)]"
              {...register("password")}
              disabled={loading}
            />
            {errors.password ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.password.message}</p> : null}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-medium rounded-md transition-colors duration-150 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-[color:var(--text-secondary)]">
          Already have an account? <Link to="/login" className="text-[color:var(--accent)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
