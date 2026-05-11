import Link from "next/link";
import Image from "next/image";

/**
 * Минимальный layout для страниц авторизации:
 * только логотип сверху и центрированная карточка с формой.
 * Использует группу маршрутов (auth) — она не влияет на URL.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <Link
        href="/"
        className="mb-10 flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <Image
          src="/logo.png"
          alt="StudyFlow"
          width={88}
          height={88}
          priority
          className="size-10 object-contain"
        />
        <span className="font-serif text-xl font-medium tracking-tight">
          StudyFlow
        </span>
      </Link>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
