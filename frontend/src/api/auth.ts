import { request } from "./client";
import type { User } from "../types/auth";

export function signup(email: string, password: string) {
  return request<User>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
export function logout() {
  return request<void>("/auth/logout", { method: "POST" });
}

export function me() {
  return request<User>("/auth/me");
}
