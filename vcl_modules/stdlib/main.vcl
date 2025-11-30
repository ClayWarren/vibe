# VCL stdlib

define ensure_true:
  ensure true.
end.

define log_value:
  send value.
  return none.
end.

define store_value:
  store value into items.
  return none.
end.

define fetch_users:
  let items = fetch users.
  return items.
end.
