-- 修复admin_url列缺失问题
-- 检查并添加admin_url列（如果不存在）
PRAGMA foreign_keys=off;

-- 创建临时表
CREATE TABLE IF NOT EXISTS platforms_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    api_base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    models TEXT NOT NULL,
    admin_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 如果原表存在但缺少admin_url列，复制数据
INSERT OR IGNORE INTO platforms_new (id, name, api_base_url, api_key, models, admin_url, created_at, updated_at)
SELECT id, name, api_base_url, api_key, models, NULL, created_at, updated_at FROM platforms;

-- 删除原表（如果存在）
DROP TABLE IF EXISTS platforms;

-- 重命名新表
ALTER TABLE platforms_new RENAME TO platforms;

PRAGMA foreign_keys=on;

-- 重新创建索引
CREATE INDEX IF NOT EXISTS idx_platforms_name ON platforms(name);