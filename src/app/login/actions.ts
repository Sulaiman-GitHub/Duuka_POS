"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { clearRateLimit, rateLimit } from "@/lib/rate-limit";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error?: string };

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

// Compared against when the email is unknown so response time doesn't reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const { email, password } = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `login:${ip}:${email}`;
  const limit = rateLimit(key, 8, 10 * 60 * 1000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minute(s).` };

  const user = await db.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.isActive || !valid) {
    await audit(user?.id ?? null, "login.failed", "User", user?.id, email);
    return { error: "Incorrect email or password." };
  }

  clearRateLimit(key);
  await createSession(user.id);
  await audit(user.id, "login.success", "User", user.id);

  const next = String(formData.get("next") ?? "");
  // Only allow same-site relative redirects.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
