import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register(new URL('./mutate-hooks.mjs', import.meta.url), { data: { target: pathToFileURL(process.env.SENS_TARGET).href, find: process.env.SENS_FIND, replace: process.env.SENS_REPLACE } });
