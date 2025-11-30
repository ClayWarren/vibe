use http.

when http GET /api/health:
    return "ok".
end.

when http GET /api/users:
    return users.
end.

when http POST /api/users:
    ensure body.name is not_equal_to none.
    let user = body.
    store user into users.
    return user.
end.
