define get_user_profile:
  ensure user_id.
  let user = fetch user_id.
  ensure user.
  return user.
end.
