const https = require('https');
const fs = require('fs');

https.get('https://kirakiray.github.io/smartJQ/src/smartjq-recommend.js', (res) => {
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        // 读取shear-no-smartjq.js
        var shearcontent = fs.readFileSync('src/shear-no-smartjq.js', 'utf8');

        // 写入文件
        fs.writeFileSync('src/shear.js', rawData + "\n" + shearcontent, "utf-8");
    });
});