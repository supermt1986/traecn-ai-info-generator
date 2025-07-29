-- 用户注册功能迁移
-- 创建用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建默认管理员用户（密码：admin123）
INSERT OR IGNORE INTO users (id, username, password_hash, email) VALUES 
(1, 'admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin@example.com');

-- 修改现有表添加用户关联
-- 平台表添加user_id
ALTER TABLE platforms ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Agent表添加user_id  
ALTER TABLE agents ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 会话表添加user_id并更新外键
ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 为现有数据设置默认用户ID=1（管理员）
UPDATE platforms SET user_id = 1 WHERE user_id IS NULL;
UPDATE agents SET user_id = 1 WHERE user_id IS NULL;
UPDATE sessions SET user_id = 1 WHERE user_id IS NULL;

-- 创建索引优化查询
CREATE INDEX idx_platforms_user_id ON platforms(user_id);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);