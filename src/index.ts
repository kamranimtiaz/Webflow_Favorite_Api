import { Hono } from 'hono'
import { env } from 'hono/adapter';
import { cors } from 'hono/cors'

export interface Env {
  STAGING_TOKEN: string;
  PRODUCTION_TOKEN: string;
}

const app = new Hono()

const stagingToken = 'find on your webflow account'
const productionToken = 'check your webflow account'

// Constants for Collection IDs
// Staging Project Collection Ids

/*
--- Production Ids ----
const stagingToken = ''
const productionToken = '2eca2b8e05a02471a866d163b36f323b3d7168afc70b76870c530cc34e5971b1'

const mainCollectionId = '651da61a8ac88fc567c0d87b';
const careTypeCollectionId = '651da61a8ac88fc567c0d83a';
*/
const mainCollectionId = '6580fd70f18c02f8029f421c';
const careTypeCollectionId = '6580fd70f18c02f8029f41b0';

// console.log("running dev")
app.use('*', cors({origin: '*', maxAge: 3600*6}))


// Function to fetch a collection item from Webflow
async function fetchWebflowItem(collectionId: string, itemId: string): Promise<any> {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${stagingToken}`
        }
    };

    const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`;
    const response = await fetch(url, options);
    return response.json();
}

// Function to update a collection item to Webflow
async function publishWebflowItem(collectionId: string, itemId: string): Promise<any> {
  const options = {
      method: 'POST',
      headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${stagingToken}`
      },
      body: JSON.stringify({itemIds: [`${itemId}`]})
  };

  const url = `https://api.webflow.com/v2/collections/${collectionId}/items/publish`;
  const response = await fetch(url, options);
  console.log(response)
  return response.json();
}

// Endpoints to handle post request

app.post('/favourted-items', async (c) => {
    const ids: string[] = await c.req.json();
    const results = [];

    for (const itemId of ids) {
        const mainItem = await fetchWebflowItem(mainCollectionId, itemId);

        // Create a new object with only the desired fields
        let newItem = {
            'item-id':mainItem.fieldData['cms-id'],
            'care-type': mainItem.fieldData['care-type'],
            'insurer': mainItem.fieldData['insurer'],
            'age-range-final': mainItem.fieldData['age-range-final'],
            'city-state-country': mainItem.fieldData['city-state-country'],
            'slug': mainItem.fieldData['slug'],
            'name': mainItem.fieldData['name'],
            'insurance-count': mainItem.fieldData['insurance-count']
        };

        // If care-type is present, replace its value with the name from the care-type collection
        if (newItem['care-type']) {
            const careTypeId = newItem['care-type'];
            const careTypeItem = await fetchWebflowItem(careTypeCollectionId, careTypeId);
            newItem['care-type'] = careTypeItem.fieldData.name;
        }

        results.push(newItem);
    }

    return c.json(results);
});


app.post('/update-favorite-count', async (c) => {
    const field = 'favorited-total';
    // Extract parameters
    const { itemId, delta } = await c.req.json();
    // console.log(`${itemId} "+" ${delta}`)
    // Validate parameters
    if (!mainCollectionId || !itemId || !delta) {
      return c.json({ error: "Missing required parameters" }, 400);
    }
  
    // // Validate field name
    // if (!mainCollectionId.fieldData.hasOwnProperty(field)) {
    //   return c.json({ error: "Invalid field name" }, 400);
    // }
  
    // Fetch collection item
    try {
      const item = await fetchWebflowItem(mainCollectionId, itemId);
      console.log(item)
      // Check if item exists
      if (!item) {
        return c.json({ error: "Item not found" }, 404);
      }
  
      // Get current field value
      let favoriteCount = item.fieldData['favorited-total'];
      console.log(favoriteCount)
      // Check if field is a number
      if (typeof favoriteCount !== "number") {
        return c.json({ error: "Field value is not a number" }, 400);
      }
  
      // Calculate new count with delta
      delta === '+' ? favoriteCount+=1 : favoriteCount-=1;
    
  
      // Update field data
      item.fieldData[field] = favoriteCount;
  
      // Prepare update payload
      const payload = {
          isArchived: false, 
          isDraft: false,
          fieldData: item.fieldData,
      };
      
      const options = {
        method: "PATCH",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${stagingToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }

      // Send update request to Webflow
      const updateResponse = await fetch(`https://api.webflow.com/v2/collections/${mainCollectionId}/items/${itemId}`, options);          
      // Check for successful update
      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        return c.json({ error }, 500);
      }
  
      const publishedItem = await publishWebflowItem(mainCollectionId, itemId);
      console.log(publishedItem);
      // Return success message with updated item data (optional)
      return c.json({ success: true, item: publishedItem });
    } catch (error) {
      return c.json({ "errormessage":"Server Error" }, 500);
    }
  });
  




// export default app;

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx)
  },
}
