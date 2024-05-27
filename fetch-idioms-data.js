const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');

async function fetchIdioms() {
    try {
        const { data } = await axios.get('https://ko.wikiquote.org/wiki/%ED%95%9C%EB%AC%B8_%EC%84%B1%EC%96%B4');
        const $ = cheerio.load(data);
        const idioms = [];

        $('table.wikitable tbody tr').each((index, element) => {
            const tds = $(element).find('td');
            if (tds.length > 0) {
                const idiom = $(tds[0]).text().trim();
                const meaning = $(tds[1]).text().trim();
                const detailed_meaning = $(tds[2]).text().trim();
                idioms.push({ idiom, meaning, detailed_meaning });
            }
        });

        console.log(idioms);
        await saveIdiomsToDB(idioms);
    } catch (error) {
        console.error('데이터를 가져오는 중 오류가 발생했습니다:', error);
    }
}

async function saveIdiomsToDB(idioms) {
    const connection = await mysql.createConnection({
        host: 'localhost', // 호스트 주소 (로컬에서 쓰면 걍 localhost 고정)
        user: 'username',  // MySQL 아이디
        password: 'password',  // MySQL 비밀번호
        database: 'database' // 사용할 데이터베이스명
    });

    try {
        await connection.beginTransaction();

        for (const { idiom, meaning, detailed_meaning} of idioms) {
            await connection.query(
                'INSERT INTO idioms (idiom, meaning, detailed_meaning) VALUES (?, ?, ?)',
                [idiom, meaning, detailed_meaning]
            );
        }

        await connection.commit();
        console.log('모든 사자성어가 성공적으로 저장되었습니다.');
    } catch (error) {
        await connection.rollback();
        console.error('데이터베이스에 저장하는 중 오류가 발생했습니다:', error);
    } finally {
        await connection.end();
    }
}

fetchIdioms();
