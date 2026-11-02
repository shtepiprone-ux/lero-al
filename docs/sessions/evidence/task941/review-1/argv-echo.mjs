// Task 941 review 1 self-check: prints the arguments a native program receives, one JSON array per call.
console.log(JSON.stringify(process.argv.slice(2)));
