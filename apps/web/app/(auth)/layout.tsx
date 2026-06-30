import { AuthLayoutChrome } from "@/features/auth/components/auth-layout-chrome";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthLayoutChrome>{children}</AuthLayoutChrome>;
}
