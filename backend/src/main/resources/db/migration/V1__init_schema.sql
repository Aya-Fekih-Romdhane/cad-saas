-- ============================================================
-- V1 - Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255),
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    avatar_url  VARCHAR(500),
    role        VARCHAR(20) NOT NULL DEFAULT 'USER',
    provider    VARCHAR(20) DEFAULT 'LOCAL',
    provider_id VARCHAR(255),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- REFRESH TOKENS
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       VARCHAR(512) NOT NULL UNIQUE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PASSWORD RESET TOKENS
CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       VARCHAR(512) NOT NULL UNIQUE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    prompt          TEXT,
    input_type      VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    error_message   TEXT,
    thumbnail_path  VARCHAR(500),
    cad_json        JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- GENERATED FILES
CREATE TABLE generated_files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_type       VARCHAR(20) NOT NULL,
    file_size       BIGINT,
    mime_type       VARCHAR(100),
    is_primary      BOOLEAN DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AI INTERACTIONS (audit log)
CREATE TABLE ai_interactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    prompt_tokens   INT,
    completion_tokens INT,
    total_tokens    INT,
    latency_ms      INT,
    model           VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_generated_files_project_id ON generated_files(project_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_project_id ON ai_interactions(project_id);
