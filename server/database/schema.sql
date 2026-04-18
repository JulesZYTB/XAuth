-- XAuth Master Database Schema
-- Version 2.0 (Omega Enterprise)

-- User Table (Admins & Software Owners)
CREATE TABLE user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application Table
CREATE TABLE app (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  secret_key VARCHAR(255) NOT NULL,
  broadcast_message VARCHAR(255) NULL,
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
);

-- License Table
CREATE TABLE license (
  id INT PRIMARY KEY AUTO_INCREMENT,
  app_id INT NOT NULL,
  user_id INT NULL,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_key_hash VARCHAR(64),
  hwid VARCHAR(255) NULL,
  hwid_hash VARCHAR(64) NULL,
  ip_lock VARCHAR(45) NULL,
  status ENUM('active', 'revoked', 'expired', 'banned') DEFAULT 'active',
  expiry_date DATETIME NOT NULL,
  variables JSON DEFAULT (JSON_OBJECT()),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES app(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
);

-- Webhook Table
CREATE TABLE webhook (
  id INT PRIMARY KEY AUTO_INCREMENT,
  app_id INT NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255) NULL,
  event_types VARCHAR(255) DEFAULT 'all',
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES app(id) ON DELETE CASCADE
);

-- Session Table
CREATE TABLE session (
  id VARCHAR(36) PRIMARY KEY,
  nonce VARCHAR(255) NOT NULL,
  app_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES app(id) ON DELETE CASCADE
);

CREATE INDEX idx_license_key_hash ON license(license_key_hash);
CREATE INDEX idx_hwid_hash ON license(hwid_hash);

-- Enterprise Analytics & Telemetry Layer
CREATE TABLE validation_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  license_id INT NULL,
  app_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  country VARCHAR(100) DEFAULT 'Unknown',
  country_code CHAR(2) DEFAULT '??',
  status ENUM('success', 'failed') NOT NULL,
  error_type VARCHAR(50) NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES app(id) ON DELETE CASCADE
);

-- Software Lifecycle & Release Management
CREATE TABLE app_release (
  id INT PRIMARY KEY AUTO_INCREMENT,
  app_id INT NOT NULL,
  version VARCHAR(50) NOT NULL,
  channel ENUM('stable', 'beta') DEFAULT 'stable',
  download_url TEXT NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES app(id) ON DELETE CASCADE
);

-- Audit Log Table
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  app_id INT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  session_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (app_id) REFERENCES app(id) ON DELETE CASCADE
);

-- API Keys (Developer Automation)
CREATE TABLE api_key (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);


-- Seed System Admin (password: admin123)
INSERT INTO user (username, email, password, role) 
VALUES ('system_admin', 'admin@xauth.monster', '$2b$10$D47xnYd1BrlSCV1akPpZdO44higeVEuCe2JV27iI2IOy1/o1FAYIG', 'admin');
