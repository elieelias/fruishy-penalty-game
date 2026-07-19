import { notFound } from "next/navigation";
import RegistrationPreview from "./RegistrationPreview";

export default function RegistrationPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#ffdcc4] py-4">
      <RegistrationPreview />
    </main>
  );
}
