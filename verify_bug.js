
const tsString = "1735708800000000";
const date = new Date(tsString);

console.log(`Input: "${tsString}"`);
console.log(`new Date(input):`, date.toString());
console.log(`getTime():`, date.getTime());

if (isNaN(date.getTime())) {
    console.log("FAIL: calculator.ts logic will produce NaN metrics.");
} else {
    console.log("PASS: JS magically handles it?");
}
