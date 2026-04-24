import { ClientSecretCredential } from "@azure/identity";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const config = {
    tenantId: process.env.TENANT_ID,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    graphqlEndpoint: process.env.GRAPHQL_ENDPOINT,
};

const app = express();
app.use(cors());
app.use(express.json());

let cachedToken = null;

async function getAccessToken() {
    if (cachedToken) {
        return cachedToken;
    }

    const hasAllAuthEnv = config.tenantId && config.clientId && config.clientSecret;
    if (!hasAllAuthEnv) {
        return null;
    }

    try {
        const credential = new ClientSecretCredential(
            config.tenantId,
            config.clientId,
            config.clientSecret
        );
        const accessToken = await credential.getToken('https://analysis.windows.net/powerbi/api/.default');
        cachedToken = accessToken?.token ?? null;
        return cachedToken;
    } catch (error) {
        console.error('토큰 발급 실패:', error.message);
        return null;
    }
}

app.get('/', async (req, res) => {
    console.log('GET / 요청 수신');
    const token = await getAccessToken();

    res.json({
        status: "OK",
        message: "조회에 성공했습니다.",
        tokenReady: Boolean(token),
        ...(token ? { token: token } : {})
    });
});

app.get('/v1/travels', async (req, res) => {
    try {
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

        const variables = {
            name: "보물섬"
        };

        if (!config.graphqlEndpoint) {
            return res.status(500).json({
                status: "ERROR",
                message: "GRAPHQL_ENDPOINT가 설정되지 않았습니다."
            });
        }

        const token = await getAccessToken();
        if (!token) {
            return res.status(401).json({
                status: "ERROR",
                message: "액세스 토큰을 발급하지 못했습니다."
            });
        }

        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query, variables }),
        });

        const rawBody = await response.text();
        let responseJson = null;
        try {
            responseJson = rawBody ? JSON.parse(rawBody) : null;
        } catch {
            responseJson = null;
        }

        if (!responseJson) {
            return res.status(502).json({
                status: "ERROR",
                message: "GraphQL 응답이 JSON 형식이 아닙니다.",
                upstreamStatus: response.status,
                upstreamBodyPreview: rawBody?.slice(0, 400)
            });
        }

        const itemList = responseJson?.data?.namhae_travels?.items;

        if (!response.ok || responseJson?.errors) {
            return res.status(502).json({
                status: "ERROR",
                message: "GraphQL 조회에 실패했습니다.",
                upstreamStatus: response.status,
                errors: responseJson?.errors ?? []
            });
        }

        if (!Array.isArray(itemList)) {
            return res.status(502).json({
                status: "ERROR",
                message: "GraphQL 응답 형식이 예상과 다릅니다.",
                raw: responseJson
            });
        }

        return res.json({
            status: "OK",
            message: "조회에 성공했습니다.",
            data: itemList
        });
    } catch (error) {
        return res.status(500).json({
            status: "ERROR",
            message: "서버 처리 중 오류가 발생했습니다.",
            detail: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});