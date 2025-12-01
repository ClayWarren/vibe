define on_http_GET_api_health:
  return "ok".
end.
define on_http_GET_api_users:
  ensure users.
  return users.
end.
define on_http_POST_api_users:
  ensure body.
  let user = body.
  store user into users.
  return user.
end.
