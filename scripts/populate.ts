import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function populate() {
    const { GET } = await import('../src/app/api/update-courses/route.js');
    console.log("Running population script...");
    const req = new Request('http://localhost:3000/api/update-courses', {
        headers: new Headers({
            'authorization': `Bearer ${process.env.CRON_SECRET || ''}`
        })
    });

    const res = await GET(req);
    const json = await res.json();
    console.log(json);
}
populate();
