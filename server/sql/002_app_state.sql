-- Серверное состояние приложения на пользователя.
-- Клиент хранит снимок склада и изделий одним атомарным JSON-документом.
create table app_state (
  user_id integer primary key references users(id) on delete cascade,
  payload text not null,
  updated_at integer not null
);
