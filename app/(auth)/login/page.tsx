import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Вход — StudyFlow",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-medium tracking-tight">Вход</h1>
        <p className="text-sm text-muted-foreground">
          Войдите в свой аккаунт StudyFlow
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link
          href="/register"
          className="text-primary underline-offset-4 hover:underline"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
