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

function getMissingAuthEnvKeys() {
    const requiredKeys = ["TENANT_ID", "CLIENT_ID", "CLIENT_SECRET"];
    return requiredKeys.filter((key) => !process.env[key]);
}

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
        tokenReady: Boolean(token)
    });
});

// Helper: Fabric GraphQL 호출 공통 함수
async function queryGraphQL(query, variables = {}) {
    if (!config.graphqlEndpoint) {
        throw Object.assign(new Error("GRAPHQL_ENDPOINT가 설정되지 않았습니다."), { code: 'NO_ENDPOINT' });
    }
    const token = await getAccessToken();
    if (!token) {
        const missing = getMissingAuthEnvKeys();
        throw Object.assign(new Error("액세스 토큰을 발급하지 못했습니다."), { code: 'NO_TOKEN', missing });
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
    let json = null;
    try { json = rawBody ? JSON.parse(rawBody) : null; } catch {}
    if (!json) throw Object.assign(new Error("GraphQL 응답이 JSON 형식이 아닙니다."), { code: 'BAD_JSON', status: response.status, preview: rawBody?.slice(0, 400) });
    if (!response.ok || json?.errors) throw Object.assign(new Error("GraphQL 조회에 실패했습니다."), { code: 'GQL_ERROR', status: response.status, errors: json?.errors ?? [] });
    return json;
}

// GET /api/travels - 전체 관광지 목록 (앱 호환 포맷)
app.get('/api/travels', async (req, res) => {
    try {
        const query = `
            query {
                namhae_travels {
                    items {
                        no
                        name
                        address
                        latitude
                        longitude
                        type
                        type_no
                        tel
                        theme
                        has_parkinglot
                        parkinglot_count
                        homepage
                        description
                    }
                }
            }
        `;
        const json = await queryGraphQL(query);
        const result = json?.data?.namhae_travels;
        if (!result) {
            return res.status(502).json({ status: "ERROR", message: "GraphQL 응답 형식이 예상과 다릅니다.", raw: json });
        }
        return res.json({ namhae_travels: result });
    } catch (error) {
        if (error.code === 'NO_ENDPOINT') return res.status(500).json({ status: "ERROR", message: error.message });
        if (error.code === 'NO_TOKEN') return res.status(401).json({ status: "ERROR", message: error.message, missingEnvKeys: error.missing });
        if (error.code === 'BAD_JSON') return res.status(502).json({ status: "ERROR", message: error.message, upstreamStatus: error.status, upstreamBodyPreview: error.preview });
        if (error.code === 'GQL_ERROR') return res.status(502).json({ status: "ERROR", message: error.message, upstreamStatus: error.status, errors: error.errors });
        return res.status(500).json({ status: "ERROR", message: "서버 처리 중 오류가 발생했습니다.", detail: error.message });
    }
});

// GET /api/travels/:no - 특정 관광지 상세 조회
app.get('/api/travels/:no', async (req, res) => {
    try {
        const no = parseInt(req.params.no, 10);
        if (isNaN(no)) return res.status(400).json({ status: "ERROR", message: "유효한 번호를 입력해주세요." });
        const query = `
            query ($no: Int!) {
                namhae_travels(filter: { no: { eq: $no } }) {
                    items {
                        no
                        name
                        address
                        latitude
                        longitude
                        type
                        type_no
                        tel
                        theme
                        has_parkinglot
                        parkinglot_count
                        homepage
                        description
                    }
                }
            }
        `;
        const json = await queryGraphQL(query, { no });
        const items = json?.data?.namhae_travels?.items;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(404).json({ status: "ERROR", message: "해당 관광지를 찾을 수 없습니다." });
        }
        return res.json(items[0]);
    } catch (error) {
        if (error.code === 'NO_ENDPOINT') return res.status(500).json({ status: "ERROR", message: error.message });
        if (error.code === 'NO_TOKEN') return res.status(401).json({ status: "ERROR", message: error.message, missingEnvKeys: error.missing });
        if (error.code === 'BAD_JSON') return res.status(502).json({ status: "ERROR", message: error.message, upstreamStatus: error.status, upstreamBodyPreview: error.preview });
        if (error.code === 'GQL_ERROR') return res.status(502).json({ status: "ERROR", message: error.message, upstreamStatus: error.status, errors: error.errors });
        return res.status(500).json({ status: "ERROR", message: "서버 처리 중 오류가 발생했습니다.", detail: error.message });
    }
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
            const missingKeys = getMissingAuthEnvKeys();
            return res.status(401).json({
                status: "ERROR",
                message: "액세스 토큰을 발급하지 못했습니다.",
                missingEnvKeys: missingKeys,
                hint: "Azure App Service Application Settings에 TENANT_ID, CLIENT_ID, CLIENT_SECRET 값을 등록하세요."
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});