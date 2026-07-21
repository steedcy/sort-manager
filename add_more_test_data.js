const http = require('http');
const accessToken = process.env.SORT_ACCESS_TOKEN;

if (!accessToken) {
    throw new Error('Set SORT_ACCESS_TOKEN to a current v1.4 access token before running this script.');
}

const newCategories = [
    { name: '美妆护肤', icon: 'Sparkles', color: '#f472b6' },
    { name: '清洁用品', icon: 'Droplets', color: '#38bdf8' },
    { name: '宠物用品', icon: 'Cat', color: '#fb923c' },
    { name: '汽车用品', icon: 'Car', color: '#94a3b8' },
    { name: '数码配件', icon: 'Cable', color: '#a78bfa' }
];

// we already have 厨房 (id: 3), 书房 (id: 4)
const newLocations = [
    { name: '卫生间', description: '主卫', parentId: null }, 
    { name: '阳台', description: '生活阳台', parentId: null }, 
    { name: '玄关', description: '入户区域', parentId: null }  
];

function requestData(path, method, data = null) {
    return new Promise((resolve, reject) => {
        let options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${accessToken}`
            }
        };
        
        let reqData = '';
        if (data) {
            reqData = Buffer.from(JSON.stringify(data), 'utf8');
            options.headers['Content-Length'] = reqData.length;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch(e) {
                    resolve(body);
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(reqData);
        req.end();
    });
}

async function run() {
    console.log('Adding new categories...');
    for (const cat of newCategories) {
        await requestData('/api/v1/categories', 'POST', cat);
        console.log('Added category:', cat.name);
    }

    console.log('Adding top level locations...');
    const loc11 = await requestData('/api/v1/locations', 'POST', newLocations[0]);
    const loc12 = await requestData('/api/v1/locations', 'POST', newLocations[1]);
    const loc13 = await requestData('/api/v1/locations', 'POST', newLocations[2]);
    
    const bathroomId = loc11.data.id;
    const balconyId = loc12.data.id;
    const entranceId = loc13.data.id;

    console.log('Adding sub-locations...');
    const subLocations = [
        { name: '洗手台柜', description: '镜柜内部', parentId: bathroomId },
        { name: '淋浴间置物架', description: '', parentId: bathroomId },
        { name: '阳台储物柜', description: '', parentId: balconyId },
        { name: '鞋柜', description: '进门鞋柜', parentId: entranceId },
        { name: '厨房吊柜', description: '存放干货', parentId: 3 }, // 厨房 id 3
        { name: '冰箱', description: '冷藏和冷冻', parentId: 3 },
        { name: '书架', description: '开放式书架', parentId: 4 }, // 书房 id 4
        { name: '书桌抽屉', description: '', parentId: 4 }
    ];

    for (const loc of subLocations) {
        await requestData('/api/v1/locations', 'POST', loc);
        console.log('Added location:', loc.name);
    }
    
    console.log('Done adding preset data!');
}

run();
