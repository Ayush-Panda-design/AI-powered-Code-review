import Link from "next/link";

import { ShipFlowLogo } from "@/components/brand/shipflow-logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" className="transition-opacity hover:opacity-80">
        <ShipFlowLogo size="md" />
      </Link>
      {children}
    </div>
  );
}
