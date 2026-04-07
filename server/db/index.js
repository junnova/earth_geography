const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'landmarks.db')
const db = new Database(dbPath)

// 开启 WAL 模式
db.pragma('journal_mode = WAL')

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS landmarks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    country_name  VARCHAR(100) NOT NULL,
    country_code  CHAR(2)      NOT NULL,
    latitude      REAL         NOT NULL,
    longitude     REAL         NOT NULL,
    landmark_name VARCHAR(200) NOT NULL DEFAULT '',
    description   TEXT         NOT NULL DEFAULT '',
    icon_url      VARCHAR(500) NOT NULL DEFAULT '',
    image_url     VARCHAR(500) DEFAULT '',
    category      VARCHAR(50)  DEFAULT '',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
  )
`)

// 创建索引（忽略已存在的）
try { db.exec('CREATE INDEX idx_country_code ON landmarks(country_code)') } catch (e) {}
try { db.exec('CREATE INDEX idx_country_name ON landmarks(country_name)') } catch (e) {}

module.exports = db
