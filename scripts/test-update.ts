import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { GET } from '../src/app/api/update-courses/route.js';

async function test() {
    const res = await GET({ headers: { get: () => null } } as unknown as Request);
    console.log(await res.json());
}
test();
