const http = require('http');

const itemSpecificImages = {
    'MacBook Pro': '/images/macbook.png',
    '备用手机': '/images/iphone.png',
    '蓝牙耳机': '/images/airpods.png',
    '夏季T恤': '/images/clothing.png',
    '运动鞋': '/images/clothing.png',
    '电钻': '/images/drill.png',
    '老虎钳': '/images/drill.png',
    '黑色中性笔': '/images/stationery.png',
    'A4打印纸': '/images/stationery.png',
    '可乐': '/images/cola.png',
    '薯片': '/images/food.png',
    '感冒药': '/images/medicine.png',
    '布洛芬': '/images/medicine.png',
    '三体(全集)': '/images/threebody.png',
    '算法导论': '/images/threebody.png',
    '瑜伽垫': '/images/yogamat.png',
    '跳绳': '/images/yogamat.png',
    '洗衣液': '/images/detergent.png',
    '垃圾袋': '/images/misc.png',
    '剪刀': '/images/stationery.png',
    '指甲刀套装': '/images/misc.png',
    '充电线': '/images/electronics.png',
    '充电宝': '/images/powerbank.png',
    '遥控器': '/images/electronics.png',
    '冬季外套': '/images/clothing.png',
    '螺丝刀套装': '/images/drill.png',
    '笔记本': '/images/stationery.png',
    '创可贴': '/images/medicine.png'
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
    let res = await requestData('/api/items', 'GET');
    let items = res.data;
    console.log(`Found ${items.length} items to update...`);

    for (let item of items) {
        let imageUrl = itemSpecificImages[item.name];
        if (imageUrl) {
            item.imageUrl = imageUrl;
            await requestData('/api/items/' + item.id, 'PUT', item);
            console.log(`Updated item: ${item.name} -> ${imageUrl}`);
        }
    }
    console.log('All specific items updated with tailored images!');
}

run();
