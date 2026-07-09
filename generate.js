const NUMBER_OF_TOKENS = 3000;
const OUTPUT_FILE = 'supabase_ready_tokens.csv';

async function main() {
    const fs = await import('node:fs');
    const crypto = await import('node:crypto');

    // CSV Header row matching your Supabase columns
    let csvContent = 'id,qr_token\n';

    for (let i = 0; i < NUMBER_OF_TOKENS; i++) {
        const id = crypto.randomUUID();
        const qrToken = crypto.randomUUID();

        csvContent += `${id},${qrToken}\n`;
    }

    // Save the file
    fs.writeFileSync(OUTPUT_FILE, csvContent);
    console.log(`Successfully generated ${NUMBER_OF_TOKENS} tokens in '${OUTPUT_FILE}'`);
}

void main();
