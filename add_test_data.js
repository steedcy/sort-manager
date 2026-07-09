const http = require('http');

const items = [
    { name:"MacBook Pro", description:"工作用电脑", quantity:1, categoryId:1, locationId:4 },
    { name:"备用手机", description:"iPhone 12", quantity:1, categoryId:1, locationId:9 },
    { name:"蓝牙耳机", description:"AirPods Pro", quantity:1, categoryId:1, locationId:7 },
    { name:"夏季T恤", description:"纯棉短袖", quantity:5, categoryId:2, locationId:8 },
    { name:"运动鞋", description:"跑步鞋", quantity:2, categoryId:2, locationId:2 },
    { name:"电钻", description:"冲击钻", quantity:1, categoryId:3, locationId:5 },
    { name:"老虎钳", description:"", quantity:1, categoryId:3, locationId:5 },
    { name:"黑色中性笔", description:"0.5mm", quantity:10, categoryId:4, locationId:4 },
    { name:"A4打印纸", description:"500张/包", quantity:2, categoryId:4, locationId:4 },
    { name:"可乐", description:"听装可口可乐", quantity:6, categoryId:5, locationId:3 },
    { name:"薯片", description:"原味", quantity:3, categoryId:5, locationId:1 },
    { name:"感冒药", description:"999感冒灵", quantity:2, categoryId:6, locationId:9 },
    { name:"布洛芬", description:"止痛退烧", quantity:1, categoryId:6, locationId:9 },
    { name:"三体(全集)", description:"科幻小说", quantity:3, categoryId:7, locationId:4 },
    { name:"算法导论", description:"工具书", quantity:1, categoryId:7, locationId:4 },
    { name:"瑜伽垫", description:"粉色", quantity:1, categoryId:8, locationId:2 },
    { name:"跳绳", description:"计数跳绳", quantity:1, categoryId:8, locationId:5 },
    { name:"洗衣液", description:"薰衣草香", quantity:2, categoryId:9, locationId:5 },
    { name:"垃圾袋", description:"黑色大号", quantity:5, categoryId:9, locationId:3 },
    { name:"剪刀", description:"办公剪刀", quantity:2, categoryId:10, locationId:7 },
    { name:"指甲刀套装", description:"", quantity:1, categoryId:10, locationId:9 },
    { name:"充电线", description:"Type-C", quantity:4, categoryId:1, locationId:10 }
];

function addItem(item) {
    return new Promise((resolve, reject) => {
        const data = Buffer.from(JSON.stringify(item), 'utf8');
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api/items',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log(`Starting to add ${items.length} items...`);
    for (const item of items) {
        try {
            await addItem(item);
            console.log('Added:', item.name);
        } catch (e) {
            console.error('Failed to add:', item.name, e.message);
        }
    }
    console.log('Done!');
}
run();
