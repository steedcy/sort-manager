const http = require('http');

const categoryFixes = {
    1: { name: '电子产品' },
    2: { name: '衣物服饰' },
    3: { name: '工具器械' },
    4: { name: '文具办公' },
    5: { name: '食品饮料' },
    6: { name: '药品医疗' },
    7: { name: '书籍资料' },
    8: { name: '运动休闲' },
    9: { name: '家居用品' },
    10: { name: '其他杂物' }
};

const locationFixes = {
    1: { name: '客厅', description: '客厅区域' },
    2: { name: '卧室', description: '主卧室' },
    3: { name: '厨房', description: '厨房区域' },
    4: { name: '书房', description: '书房/工作间' },
    5: { name: '储物间', description: '杂物储藏室' },
    6: { name: '电视柜', description: '电视机下方的柜子' },
    7: { name: '沙发茶几', description: '沙发旁边的茶几' },
    8: { name: '衣柜', description: '主卧衣柜' },
    9: { name: '床头柜', description: '床头两侧的柜子' },
    10: { name: '梳妆台', description: '梳妆台抽屉' }
};

const itemFixes = {
    1: { name: '充电宝', description: '20000mAh大容量充电宝' },
    2: { name: '遥控器', description: '电视遥控器' },
    3: { name: '冬季外套', description: '黑色羽绒服' },
    4: { name: '螺丝刀套装', description: '十字和一字螺丝刀' },
    5: { name: '笔记本', description: 'A5横线笔记本' },
    6: { name: '创可贴', description: '碧迪创可贴' }
};

function requestData(path, method, data = null) {
    return new Promise((resolve, reject) => {
        let options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
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
    // Categories
    let res = await requestData('/api/categories', 'GET');
    let categories = res.data;
    for (let c of categories) {
        if (c.name && c.name.includes('?')) {
            let fix = categoryFixes[c.id];
            if (fix) {
                c.name = fix.name;
                await requestData('/api/categories/' + c.id, 'PUT', c);
                console.log('Fixed category:', c.id, fix.name);
            } else {
                await requestData('/api/categories/' + c.id, 'DELETE');
                console.log('Deleted unknown category:', c.id);
            }
        }
    }

    // Locations
    res = await requestData('/api/locations', 'GET');
    let locations = res.data;
    for (let l of locations) {
        if (l.name && l.name.includes('?')) {
            let fix = locationFixes[l.id];
            if (fix) {
                l.name = fix.name;
                l.description = fix.description;
                await requestData('/api/locations/' + l.id, 'PUT', l);
                console.log('Fixed location:', l.id, fix.name);
            } else {
                await requestData('/api/locations/' + l.id, 'DELETE');
                console.log('Deleted unknown location:', l.id);
            }
        }
    }

    // Items
    res = await requestData('/api/items', 'GET');
    let items = res.data;
    for (let i of items) {
        if (i.name && i.name.includes('?')) {
            let fix = itemFixes[i.id];
            if (fix) {
                i.name = fix.name;
                i.description = fix.description;
                await requestData('/api/items/' + i.id, 'PUT', i);
                console.log('Fixed item:', i.id, fix.name);
            } else {
                await requestData('/api/items/' + i.id, 'DELETE');
                console.log('Deleted unknown item:', i.id);
            }
        }
    }
    
    console.log('All ?? issues fixed!');
}
run();
