# Example VCL workflow: checkout flow

import stdlib.

when http POST /checkout:
  let cart = fetch cart_items.
  ensure cart is not_equal_to none.
  let total = call compute_total with cart.
  validate total is greater_than 0.
  send total to notifications.
  store total into last_order_total.
  return total.
end.

define compute_total items:
  let sum = 0.
  for each price in items:
    let sum = sum plus price.
  end.
  return sum.
end.
