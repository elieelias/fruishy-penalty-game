import QrScanned from "../components/QrScanned";
import { notFound } from "next/navigation";

export default function QrScannedPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <QrScanned
      initialTopPlayer={{
        rank: 1,
        name: "Maya",
        points: 12850,
      }}
    />
  );
}
