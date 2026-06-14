const crypto = require('crypto');

function encryptSync(data) {
    // 1. 固定密钥（16字节）和随机IV（12字节）
    const key = Buffer.from([189, 48, 95, 16, 208, 255, 116, 182, 239, 84, 218, 184, 53, 181, 225, 207]);
    const iv = crypto.randomBytes(12);
    // const iv = Buffer.from([255, 123, 11, 78, 189, 248, 34, 26, 45, 183, 152, 92])
    // 2. 创建加密器
    const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);

    // 3. 加密（支持对象或字符串）
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = Buffer.concat([
        cipher.update(jsonStr, 'utf8'),
        cipher.final()
    ]);

    // 4. 获取 Auth Tag
    const authTag = cipher.getAuthTag();

    // 5. 拼接并Base64编码
    const cipherWithTag = Buffer.concat([iv, encrypted, authTag]);
    return cipherWithTag.toString('base64');
}
