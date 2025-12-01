define get_user_profile:
  let user_id = 1.
  let user = fetch user_id.
  ensure user.
  return user.
end.
