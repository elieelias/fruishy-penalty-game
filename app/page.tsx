import QrScanned from "./components/QrScanned";
import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: PageProps<"/">) {
  const query = await searchParams;
  const tokenValue = query.token;
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";

  if (token) {
    redirect(`/play?token=${encodeURIComponent(token)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fcf9f8]">
      <QrScanned />
    </main>
  );
}
