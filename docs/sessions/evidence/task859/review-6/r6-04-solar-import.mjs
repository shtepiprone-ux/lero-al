const t0 = performance.now();
await import('@solar-icons/react/broken');
const t1 = performance.now();
console.log('solar-icons/react/broken import ms', Math.round(t1 - t0));
