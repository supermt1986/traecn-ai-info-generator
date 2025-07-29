-- 平台信息表
CREATE TABLE platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    api_base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    models TEXT NOT NULL, -- 逗号分隔的模型列表
    admin_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent信息表
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    env_vars TEXT NOT NULL, -- JSON格式的环境变量
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

-- 创建索引
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_platforms_name ON platforms(name);
CREATE INDEX idx_agents_name ON agents(name);