const fs = require('fs');

const jsContent = fs.readFileSync('d:/大胖狗的学习/逆向/胖狗逆向集/akm/challenge.js', 'utf8');

const match = jsContent.match(/var c8=\[(.*?)\];/s);
if (match) {
    const rawArray = match[1];
    const strings = rawArray.split(/','/).map(s => s.replace(/^['"]|['"]$/g, ''));
    console.log('Total strings:', strings.length);
    
    const ws_s_offset = 0x14c;
    
    function ws_s(idx) {
        const arrIdx = idx - ws_s_offset;
        if (arrIdx >= 0 && arrIdx < strings.length) {
            return strings[arrIdx];
        }
        return undefined;
    }
    
    console.log('\nKey strings:');
    console.log('ws_s(0x1a8):', ws_s(0x1a8));
    console.log('ws_s(0x221):', ws_s(0x221));
    
    const encodeTableStr = ws_s(0x1a8);
    if (encodeTableStr) {
        const encodeTable = encodeTableStr.split('');
        console.log('\nEncode table:', encodeTable);
        console.log('Table length:', encodeTable.length);
        console.log('\nTable JSON:', JSON.stringify(encodeTable));
    }
} else {
    console.log('Could not find string array');
}