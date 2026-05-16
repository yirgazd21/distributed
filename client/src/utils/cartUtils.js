export const addDecimals = (num) => {
  return (Math.round(num * 100) / 100).toFixed(2);
};

export const updateCart = (state) => {
  // 1. Calculate Items Price
  state.itemsPrice = addDecimals(
    state.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  );

  // 2. Calculate Shipping Price
  // Rule: If order is over 1000 ETB, shipping is free. Otherwise 50 ETB.
  state.shippingPrice = addDecimals(state.itemsPrice > 1000 ? 0 : 50);

  // 3. Calculate Tax Price (15% VAT)
  state.taxPrice = addDecimals(Number((0.15 * state.itemsPrice).toFixed(2)));

  // 4. Calculate Total Price
  state.totalPrice = (
    Number(state.itemsPrice) +
    Number(state.shippingPrice) +
    Number(state.taxPrice)
  ).toFixed(2);

  // 5. Save to LocalStorage
  localStorage.setItem('cart', JSON.stringify(state));

  return state;
};