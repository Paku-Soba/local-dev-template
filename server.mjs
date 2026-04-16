import http from 'node:http';
import fs from 'node:fs/promises';
import path, { parse, resolve } from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const PUBLIC_DIR = path.join(__dirname,'public');
const DATA_DIR = path.join(__dirname,'data');
const VIEWS_DIR = path.join(__dirname, 'views');

const MIME_TYPES = {
    '.html':'text/html; charset=utf-8',
    '.css':'text/css; charset=utf-8',
    '.js':'text/javascript; charset=utf-8',
    '.json':'application/json; charset=utf-8',
    '.txt':'text/plain; charset=utf-8',
    '.svg':'image/svg+xml',
    '.png':'image/png',
    '.jpg':'image/jpg',
    '.jpeg':'image/jpeg',
    '.ico':'image/x-icon'
};

function send (res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(body);
}

function sendJson (res, statusCode, data) {
    send(res, statusCode, JSON.stringify(data, null, 2), 'application/json; charset=utf-8');
}

async function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1_000_000) {
                reject(new Error('Payload too large'));
                req.destroy();
            }
        });

        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function safeJoin(base, targetPath) {
    const target = path.normalize(path.join(base, targetPath));
    if (!target.startsWith(base)) {
        return null;
    }
    return target;
}

async function serveStaticFile(res,pathname) {
    const normalizedPath = pathname === '/' ? '/index.html' : pathname;
    const filePath = safeJoin(PUBLIC_DIR, normalizedPath);

    if (!filePath) {
        sendJson(res, 403, { error: 'Forbidden'});
        return;
    }
    try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            sendJson(res, 403, { error: 'Directory access is not allowed'});
            return;
        }
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const file = await fs.readFile(filePath);
            send(res, 200, file, contentType);
    } catch {
         try {
            const notFoundHtml = await fs.readFile(path.join(VIEWS_DIR, 'not-found.html'));
            send(res, 404, notFoundHtml, 'text/html; charset=utf-8');
         } catch {
            sendJson(res, 404, { error: 'Not Found'});
         }
    }
}

async function getUsers() {
    //　data/users.jsonのファイルを読み込む
    const filePath = path.join(DATA_DIR, 'users.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);   
}

async function saveUsers(users) {
    const filePath = path.join(DATA_DIR, 'users.json');
    await fs.writeFile(filePath, JSON.stringify(users, null, 2 ), 'utf-8');
}

// node標準機能を使ってサーバー構築
const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
        const { pathname, searchParams } = url;
        console.log('URL確認:',url);

        if (pathname === '/api/health' && req.method === 'GET'){
            return sendJson(res, 200, {
                ok: true,
                node: process.version,
                timestamp: new Date().toISOString()
            });
        }
        if (pathname === '/api/users' && req.method === 'GET') {
            const users = await getUsers();
            const keyword = (searchParams.get('q') || '').toLowerCase();
            
            const filtered = keyword
            ? users.filter(user => 
                user.name.toLowerCase().includes(keyword) || 
                user.email.toLowerCase().includes(keyword)
            )
            : users;

            return sendJson(res, 200, filtered);
        }
        if (pathname === '/api/users' && req.method === 'POST') {
            console.log('登録API呼び出し確認')
            const body = await readBody(req);
            const parsed = JSON.parse(body || '{}');

            if (!parsed.name || !parsed.email) {
                return sendJson(res, 400, {
                    error: 'name and email are rquired'
                });
            }
            const users = await getUsers();
            const newUser = {
                //新しいデータにユニークな識別子を付与する※データ整合性をとるためのインフラ機能
                id: crypto.randomUUID(),
                name: String(parsed.name),
                email: String(parsed.email),
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            await saveUsers(users);

            return sendJson(res, 201, newUser);
        }
        // 更新API作成
        // サーバ側パス指定の検証用
        if (req.method === 'PATCH'){
            // URLパターンの定義
            const pattern = new URLPattern({pathname: '/api/users/:id'});
            // URLが定義したパターンに一致するか検証
            const match = pattern.exec({pathname: req.url});
            // 検証結果として返されたオブジェクトからユーザーidを取得する
            const getUserId = match.pathname.groups.id;
            console.log('URLパターン定義からユーザーid取得:',getUserId);
            const body = await readBody(req);
            const parsed = JSON.parse(body || '{}');
            console.log('payloadデータ中身確認:',parsed);
            if (!parsed.email) {
                return sendJson(res, 400, {
                    error: 'email are rquired'
                });
            }
            // data/users.jsonよりユーザー情報を取得
            const users = await getUsers();
            // 編集対象のユーザーidをURLのpathnameから取得
            const targetUserId = getUserId;
            // 編集対象のユーザーidと照合を行う
            const targetUser = users.find(user => user.id === targetUserId);
            // 編集対象のユーザーがない場合、404を返す
            if (!targetUser) {
                return sendJson(res, 404, { error: 'User not found' });
            } 
            targetUser.name = parsed.name;
            targetUser.email = parsed.email;
            targetUser.updatedAt = new Date().toISOString();
            // 編集したユーザーの保存処理ができたのか
            await saveUsers(users);
            
            return sendJson(res, 200, targetUser);

        }
        return serveStaticFile(res, pathname);
    } catch(error) {
        console.error(error);
        return sendJson(res, 500, {
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});