import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_KEY;

const bucket = process.env.SUPABASE_QR_BUCKET ?? "extra-token-qrs";
const qrDir =
  process.env.EXTRA_TOKEN_QR_DIR ??
  path.join(process.cwd(), "artifacts", "extra-token-qrs");

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script."
  );
}

const files = (await readdir(qrDir))
  .filter((file) => file.endsWith(".png"))
  .sort();

let uploaded = 0;
let skipped = 0;
let failed = 0;
const failures = [];
const concurrency = 20;

async function uploadFile(file) {
  const objectPath = encodeURIComponent(file);
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Cache-Control": "31536000",
        "Content-Type": "image/png",
        "x-upsert": "false",
      },
      body: createReadStream(path.join(qrDir, file)),
      duplex: "half",
    }
  );

  if (response.ok) {
    uploaded += 1;
    return;
  }

  const text = await response.text();
  if (response.status === 409 || text.toLowerCase().includes("already exists")) {
    skipped += 1;
    return;
  }

  failed += 1;
  failures.push({ file, status: response.status, body: text });
}

for (let index = 0; index < files.length; index += concurrency) {
  await Promise.all(files.slice(index, index + concurrency).map(uploadFile));
  const done = Math.min(index + concurrency, files.length);
  if (done % 500 === 0 || done === files.length) {
    console.log({ done, uploaded, skipped, failed });
  }

  if (failed > 20) break;
}

if (failed > 0) {
  console.error(JSON.stringify(failures.slice(0, 20), null, 2));
  process.exit(1);
}

console.log({ total: files.length, uploaded, skipped, failed });
