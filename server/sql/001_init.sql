-- Схема Пряжника, версия 1.
-- Колонки snake_case. id мотков, изделий, этапов и заметок — клиентские
-- (Date.now()) и вместе с user_id образуют ключ. Байты картинок лежат в
-- data/files/<id>, в таблицах только ссылки.

create table meta (
  key text primary key,
  value text not null
);

create table users (
  id integer primary key,
  username text not null unique,
  password_hash text not null,
  created_at integer not null
);

create table sessions (
  token text primary key,
  user_id integer not null references users(id) on delete cascade,
  expires_at integer not null
);

create table files (
  id integer primary key,
  user_id integer not null references users(id) on delete cascade,
  kind text not null check (kind in ('yarn', 'note', 'project')),
  mime text not null,
  byte_size integer not null,
  created_at integer not null
  -- байты лежат в ./data/files/<id>.jpg, не в этой таблице
);

create table yarns (
  user_id integer not null references users(id) on delete cascade,
  id integer not null,
  brand text not null,
  color_name text not null,
  color_code text not null default '',
  weight real not null,
  length real not null,
  stock integer not null,
  needle_size text not null default '',
  hook_size text not null default '',
  gauge_sample text not null default '',
  photo_file_id integer references files(id) on delete set null,
  created_at integer not null,
  updated_at integer not null,
  primary key (user_id, id)
);

create table yarn_materials (
  user_id integer not null,
  yarn_id integer not null,
  position integer not null,
  name text not null,
  percentage integer not null,
  primary key (user_id, yarn_id, position),
  foreign key (user_id, yarn_id) references yarns(user_id, id) on delete cascade
);

create table projects (
  user_id integer not null references users(id) on delete cascade,
  id integer not null,
  title text not null,
  status text not null check (status in ('planned', 'in_progress', 'finished')),
  created_at integer not null,
  updated_at integer not null,
  current_rows integer,
  target_rows integer,
  -- поля иконки и цвета. Клиент с main их не пришлёт — останутся значения по умолчанию.
  icon text not null default 'garment',
  accent text not null default 'neutral',
  -- задел под фото изделия. Пока UI этого нет, всегда null.
  photo_file_id integer references files(id) on delete set null,
  primary key (user_id, id)
);

create table project_materials (
  user_id integer not null,
  project_id integer not null,
  position integer not null,
  yarn_id integer not null,
  quantity integer not null,
  primary key (user_id, project_id, position),
  unique (user_id, project_id, yarn_id),
  foreign key (user_id, project_id) references projects(user_id, id) on delete cascade,
  foreign key (user_id, yarn_id) references yarns(user_id, id)
  -- без cascade: моток, который указан в изделии, удалить нельзя
);

create table project_stages (
  user_id integer not null,
  project_id integer not null,
  id integer not null,
  position integer not null,
  title text not null,
  target_rows integer,
  current_rows integer,
  done integer not null default 0 check (done in (0, 1)),
  primary key (user_id, id),
  unique (user_id, project_id, position),
  foreign key (user_id, project_id) references projects(user_id, id) on delete cascade
);

create table project_notes (
  user_id integer not null,
  project_id integer not null,
  id integer not null,
  created_at integer not null,
  title text,
  text text not null,
  primary key (user_id, id),
  foreign key (user_id, project_id) references projects(user_id, id) on delete cascade
);

-- задел под фото в заметках. Строк нет, пока кнопка «в разработке».
create table note_files (
  user_id integer not null,
  note_id integer not null,
  position integer not null,
  file_id integer not null references files(id),
  primary key (user_id, note_id, position),
  foreign key (user_id, note_id) references project_notes(user_id, id) on delete cascade
);

create table state_revisions (
  user_id integer primary key references users(id) on delete cascade,
  revision integer not null
);
