import json, os, sys, subprocess

# az CLI로 토큰 획득 (Windows에서 az.cmd 사용)
token = subprocess.check_output(
    ['az.cmd', 'account', 'get-access-token', '--resource',
     '499b84ac-1321-427f-aa17-267ca6975798', '--query', 'accessToken', '-o', 'tsv'],
    text=True, shell=True
).strip()

import urllib.request, urllib.error

def do_request(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    if data:
        req.data = json.dumps(data).encode('utf-8')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

BASE = 'https://vsrm.dev.azure.com/3dt005/fabric-lab/_apis/release'
d = do_request('GET', f'{BASE}/definitions/1?api-version=7.1')
print(f'Fetched revision={d["revision"]}')

SERVICE_CONN_ID = 'c8bfa8af-ce7c-464e-9785-7cbf68c0ec4a'
WEBAPP_NAME     = '3dt005'
RG_NAME         = '3dt005-fabric-group'
PKG_PATH        = '$(System.DefaultWorkingDirectory)/_fabric-lab/server-drop/server.zip'

for env in d.get('environments', []):
    for phase in env.get('deployPhases', []):
        for task in phase.get('workflowTasks', []):
            inp = task.get('inputs', {})
            inp['ConnectedServiceName'] = SERVICE_CONN_ID
            inp['WebAppName']           = WEBAPP_NAME
            inp['ResourceGroupName']    = RG_NAME
            inp['WebAppKind']           = 'webApp'
            inp['Package']              = PKG_PATH
            inp['DeploymentType']       = 'zipDeploy'
            inp['UseWebDeploy']         = 'false'
            inp['StartupCommand']       = 'node index.js'

result = do_request('PUT', f'{BASE}/definitions/1?api-version=7.1', data=d)
print(f'Updated: {result["name"]} rev={result["revision"]}')

