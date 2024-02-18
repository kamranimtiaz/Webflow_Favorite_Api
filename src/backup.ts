import { Hono } from 'hono'
import { cors } from 'hono/cors'



const app = new Hono()


app.use('*', cors({origin: '*', maxAge: 3600*6}))


// Function to fetch a collection item from Webflow
async function fetchWebflowItem(itemId: string): Promise<any> {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: 'Bearer 2eca2b8e05a02471a866d163b36f4a5b3d7168afc70b76870c530cc34e5971b1'
        }
    };

    const url = `https://api.webflow.com/v2/collections/651da61a8ac88fc567c0d87b/items/${itemId}`;
    const response = await fetch(url, options);
    return response.json();
}


app.post('/favourted-items', async (c)=>{
    // Old Code

    // const ids = await c.req.json();
    // return c.json(ids);

    const ids: string[] = await c.req.json();

    // Fetch data for each ID and collect the results
    const results = await Promise.all(ids.map(fetchWebflowItem));

    // Return the array of collection items
    return c.json(results);

});

export default app
