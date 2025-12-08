
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

// Line 2 from test2GA4.csv
// Note: In the file content I read, the JSON inner quotes were double-double quotes ""
const line = `20251201,1735708800000000,view_item,123456.789012,session_1,google,organic,mobile,Android,US,California,item_Casual_Sneakers_1,Casual Sneakers Product 1,Casual Sneakers,79.99,1,USD,,,/product/item_Casual_Sneakers_1,,"{""item_variant"": ""black"", ""item_brand"": ""BrandA""}"`;

const headersCount = 22; // There are 22 headers in the file
const values = parseCSVLine(line);

console.log(`Expected columns: ${headersCount}`);
console.log(`Parsed columns: ${values.length}`);
console.log(`Last value: ${values[values.length - 1]}`);

if (values.length !== headersCount) {
    console.log('FAIL: Column count mismatch!');
} else {
    console.log('PASS: Column count matches.');
}
