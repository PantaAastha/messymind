
function parseTimestamp(input) {
    if (!input) return null;

    // 1. Try ISO string / direct Date parsing
    const date = new Date(input);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1970 && date.getFullYear() < 2100) {
        return date;
    }

    // 2. Try parsing as number
    const num = Number(input);
    if (isNaN(num)) return null;

    // Heuristics for Seconds vs Milliseconds vs Microseconds
    // 1736364691           ~ Jan 2025 (Seconds)
    // 1736364691000        ~ Jan 2025 (Milliseconds)
    // 1736364691000000     ~ Jan 2025 (Microseconds)

    if (num > 1e14) {
        // Likely Microseconds (16 digits)
        console.log(`Input ${input} treated as Microseconds`);
        return new Date(num / 1000);
    } else if (num < 1e11) {
        // Likely Seconds (10 digits)
        console.log(`Input ${input} treated as Seconds`);
        return new Date(num * 1000);
    } else {
        // Likely Milliseconds (13 digits)
        console.log(`Input ${input} treated as Milliseconds`);
        return new Date(num);
    }
}

const rawTimestamp = "1735708800000000"; // From test2GA4.csv row 2
const parsed = parseTimestamp(rawTimestamp);

console.log(`Raw: ${rawTimestamp}`);
console.log(`Parsed ISO: ${parsed.toISOString()}`);
console.log(`Parsed Local: ${parsed.toString()}`);

// Check time difference calc logic
const rawStart = "1735708800000000";
const rawEnd = "1735717200000000"; // roughly 2.3 hours later

const d1 = parseTimestamp(rawStart);
const d2 = parseTimestamp(rawEnd);
const diffMinutes = (d2.getTime() - d1.getTime()) / 60000;

console.log(`Start: ${d1.toISOString()}`);
console.log(`End:   ${d2.toISOString()}`);
console.log(`Diff Minutes: ${diffMinutes}`);
