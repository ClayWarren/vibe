call load_config.
let user = fetch user where id equal_to user_id.
ensure user is not_equal_to none.
