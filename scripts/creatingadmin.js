const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'ecommerce_db',
  });

  //  CHANGE YOUR PASSWORD HERE
  const myPassword = "admin123"; 
  const hashedPassword = await bcrypt.hash(myPassword, 10);

  await db.execute(`
    INSERT INTO users (id, email, password, name, role, created_at, updated_at) 
    VALUES ('admin_01', 'admin@shoplite.com', ?, 'Super Admin', 'admin', NOW(), NOW())
    ON DUPLICATE KEY UPDATE role='admin', password=?
  `, [hashedPassword, hashedPassword]);

  console.log("✅ Admin Created! Login with:", myPassword);
  process.exit();
})();