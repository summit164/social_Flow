import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Регистрация — StudyFlow",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-medium tracking-tight">Регистрация</h1>
        <p className="text-sm text-muted-foreground">
          Создайте аккаунт, чтобы публиковать работы
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Войти
        </Link>
      </p>
    </div>
  );
}
