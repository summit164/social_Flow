"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "./schemas";

/**
 * Server action возвращает либо { error: string }, либо успешно редиректит.
 * Это типовой паттерн в Next.js App Router.
 */
type ActionResult = { error: string } | undefined;

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  // Дублируем валидацию на сервере — клиент мог быть скомпрометирован
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректные данные формы" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Маппим английские сообщения Supabase на русские
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Неверный email или пароль" };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function registerAction(
  input: RegisterInput
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректные данные формы" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Сохраняем username в user_metadata — на шаге 5 перенесём в profiles
      data: { username: parsed.data.username },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Пользователь с таким email уже зарегистрирован" };
    }
    return { error: error.message };
  }

  // Если в Supabase отключено подтверждение email — пользователь сразу залогинен
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  // Иначе (на случай, если подтверждение всё-таки включено)
  return { error: "Проверьте почту для подтверждения регистрации" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
