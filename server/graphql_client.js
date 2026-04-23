import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";

// Acquire a token
// DO NOT USE IN PRODUCTION.
// Below code to acquire token is for development purpose only to test the GraphQL endpoint
// For production, always register an application in a Microsoft Entra ID tenant and use the appropriate client_id and scopes
// https://learn.microsoft.com/en-us/fabric/data-engineering/connect-apps-api-graphql#create-a-microsoft-entra-app

const TENANT_ID = process.env.TENANT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENDPOINT = process.env.GRAPHQL_ENDPOINT;

const requiredEnvKeys = [
	"TENANT_ID",
	"CLIENT_ID",
	"CLIENT_SECRET",
	"GRAPHQL_ENDPOINT",
];

const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);
if (missingEnvKeys.length > 0) {
	throw new Error(
		`Missing required environment variables: ${missingEnvKeys.join(", ")}`
	);
}

let app = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
let tokenPromise = app.getToken('https://analysis.windows.net/powerbi/api/.default');
let accessToken = await tokenPromise;

const endpoint = ENDPOINT;
const query = `
query ($name: String) {
  namhae_travels(filter: {name: {contains:$name}}) {
     items {
        no
        name
        address
     }
  }
}
`;

const variables = 
  {
   "name": "보물섬"
  }
  ;

const headers = {
	'Content-Type': 'application/json',
	'Authorization': `Bearer ${accessToken.token}`
};

async function fetchData() 	{
	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify({ query, variables }),
		});

		const result = await response.json();
		console.log(JSON.stringify(result));
	} catch (error) {
		console.log('Error fetching data:', error);
	}
}

fetchData();
