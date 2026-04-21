import { createRuntimeConfig } from '../config.js';
import { runWorkerLoop } from '../runtime/workerLoop.js';

const config = createRuntimeConfig(process.env);
const result = await runWorkerLoop({ config });
console.log(JSON.stringify(result, null, 2));
