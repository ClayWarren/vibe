define get_user_profile:
    ensure user_id is provided.
    let user = fetch user where id is user_id.
    if user is none: stop with "user not found".
    return user.
end.
