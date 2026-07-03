const fs = require('fs');
const crypto = require('crypto');

const NUMBER_OF_TOKENS = 3000;
const OUTPUT_FILE = 'supabase_ready_tokens.csv';

// Helper function to generate a clean UUIDv4 string
function generateUUID() {
    return crypto.randomUUID();
}

function main() {
    // CSV Header row matching your Supabase columns
    let csvContent = 'id,qr_token\n';

    for (let i = 0; i < NUMBER_OF_TOKENS; i++) {
        const id = generateUUID();
        const qrToken = generateUUID();

        csvContent += `${id},${qrToken}\n`;
    }

    // Save the file
    fs.writeFileSync(OUTPUT_FILE, csvContent);
    console.log(`Successfully generated ${NUMBER_OF_TOKENS} tokens in '${OUTPUT_FILE}'`);
}

main();