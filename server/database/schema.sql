create database if not exists xauth;
use xauth;

create table user (

  id int unsigned primary key auto_increment not null,
  username varchar(255) not null unique,
  email varchar(255) not null unique,
  password varchar(255) not null,
  role varchar(50) not null default 'user' -- 'admin' or 'user'
);

create table app (
  id int unsigned primary key auto_increment not null,
  name varchar(255) not null,
  secret_key varchar(255) not null unique,
  broadcast_message text,
  is_paused boolean default false,
  owner_id int unsigned not null,
  foreign key(owner_id) references user(id) on delete cascade
);

create table license (
  id int unsigned primary key auto_increment not null,
  license_key varchar(255) not null unique,
  hwid varchar(255),
  expiry_date datetime not null,
  status varchar(50) not null default 'active',
  variables text,
  ip_lock varchar(255),
  app_id int unsigned not null,
  user_id int unsigned, -- The registered user who claimed this license
  foreign key(app_id) references app(id) on delete cascade,
  foreign key(user_id) references user(id) on delete set null
);

create table audit_log (
  id int unsigned primary key auto_increment not null,
  action varchar(255) not null,
  details text,
  ip_address varchar(50),
  user_agent text,
  session_id varchar(255),
  created_at timestamp default current_timestamp,
  app_id int unsigned,
  user_id int unsigned, -- link log to a user
  foreign key(app_id) references app(id) on delete set null,
  foreign key(user_id) references user(id) on delete set null
);

create table session (
  id varchar(255) primary key not null,
  nonce varchar(255) not null,
  app_id int unsigned not null,
  created_at timestamp default current_timestamp,
  expires_at datetime not null,
  foreign key(app_id) references app(id) on delete cascade
);

-- Seed an admin for testing (password: admin123)
insert into user(id, username, email, password, role)
values
  (1, "system_admin", "admin@xauth.io", "$2b$10$wT6c7WXZF.9/O6bS2z.8.Ou6vJd.G0fN1Yx6F/W5u6uLz9U8w2Y2e", "admin");


