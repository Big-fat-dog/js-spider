const crypto = require('crypto');


function get_sign(data) {    // 1. SHA-1 大写
    data = JSON.stringify(data)
    const hash = crypto.createHash('sha1').update(data).digest('hex').toUpperCase();
    console.log('SHA-1:', hash);

    // 2. 两个固定索引字符串
    const idx1 = [23, 14, 6, 36, 16, 40, 7, 19];
    const idx2 = [16, 1, 32, 12, 19, 27, 8, 5];
    const str1 = idx1.map(i => hash[i]).join('');
    const str2 = idx2.map(i => hash[i]).join('');
    // console.log('索引字符串1:', str1);
    // console.log('索引字符串2:', str2);

    // 3. 密钥（20 字节）
    const key = [89, 39, 179, 150, 218, 82, 58, 252, 177, 52, 186, 123, 120, 64, 242, 133, 143, 161, 121, 179];

    // 4. 哈希字节
    const hashBytes = [];
    for (let i = 0; i < hash.length; i += 2) {
        hashBytes.push(parseInt(hash.substring(i, i + 2), 16));
    }
    // console.log('哈希字节:', hashBytes);

    // 5. 异或结果
    const xorResult = hashBytes.map((byte, i) => byte ^ key[i]);
    // console.log('异或结果:', xorResult);

    // 6. Base64 编码
    const xorBuffer = Buffer.from(xorResult);
    const base64Sign = xorBuffer.toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=+$/, '');
    // console.log('Base64 签名:', base64Sign);
    return ("zzc"+str1+base64Sign+str2).toLowerCase()
}
// data2= {"comm":{"cv":4747474,"ct":24,"format":"json","inCharset":"utf-8","outCharset":"utf-8","notice":0,"platform":"yqq.json","needNewCode":1,"uin":0,"g_tk_new_20200303":5381,"g_tk":5381},"req_1":{"module":"music.globalComment.CommentRead","method":"GetNewCommentList","param":{"BizType":4,"BizId":"4","LastCommentSeqNo":"","PageSize":25,"PageNum":0,"FromCommentId":"","WithHot":1,"PicEnable":1,"LastTotal":0,"LastTotalVer":"0"}},"req_2":{"module":"music.globalComment.CommentRead","method":"GetHotCommentList","param":{"BizType":4,"BizId":"4","LastCommentSeqNo":"","PageSize":15,"PageNum":0,"HotType":2,"WithAirborne":1,"PicEnable":1}},"req_3":{"module":"music.globalComment.CommentAsset","method":"GetCmBgCard","param":{}}}
// console.log(get_sign(data2))
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

