
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

const dbPath = path.join(process.cwd(), 'data', 'cards.sqlite');

async function checkDB() {
    console.log(`Checking database at: ${dbPath}`);
    
    if (!fs.existsSync(dbPath)) {
        console.error('❌ Database file not found!');
        return;
    }

    const stats = fs.statSync(dbPath);
    console.log(`File size: ${stats.size} bytes`);
    console.log(`Last modified: ${stats.mtime}`);

    try {
        const filebuffer = fs.readFileSync(dbPath);
        const SQL = await initSqlJs();
        const db = new SQL.Database(filebuffer);
        
        // Count cards
        const res = db.exec("SELECT COUNT(*) as c FROM cards");
        const count = res[0].values[0][0];
        console.log(`Total cards count: ${count}`);

        // Get last 5 cards
        const stmt = db.prepare("SELECT id, uuid, nickname, content, created_at FROM cards ORDER BY id DESC LIMIT 5");
        console.log('\n--- Last 5 Entries ---');
        while (stmt.step()) {
            console.log(stmt.getAsObject());
        }
        stmt.free();
        db.close();
    } catch (e) {
        console.error('❌ Error reading database:', e);
    }
}

checkDB();
