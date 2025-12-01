define on_http_POST_checkout:
  ensure items.
  let cart_items = items.
  let sum = 0.
  for each price in cart_items:
    let sum = sum plus price.
  end.
  ensure sum greater_than 0.
  send sum.
  store sum into last_order_total.
  return sum.
end.
