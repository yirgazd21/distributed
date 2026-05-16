import { createSlice } from '@reduxjs/toolkit';
// 👇 Import the helper
import { updateCart } from '../../utils/cartUtils';

const initialState = localStorage.getItem('cart')
  ? JSON.parse(localStorage.getItem('cart'))
  : { cartItems: [], shippingAddress: {}, paymentMethod: 'Chapa' }; // Default to Chapa

const getCartItemId = (item) => item.cartItemId || `${item._id}-${item.selectedImage || item.image}`;

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = {
        ...action.payload,
        cartItemId: getCartItemId(action.payload),
      };
      const existItem = state.cartItems.find((x) => getCartItemId(x) === item.cartItemId);

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          getCartItemId(x) === item.cartItemId ? item : x
        );
      } else {
        state.cartItems = [...state.cartItems, item];
      }
      
      // 👇 Use the helper (Calculates prices + Saves to LocalStorage)
      return updateCart(state);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (x) => getCartItemId(x) !== action.payload && x._id !== action.payload
      );
      // 👇 Use the helper here too
      return updateCart(state);
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      return updateCart(state);
    },
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      return updateCart(state);
    },
    clearCartItems: (state, action) => {
      state.cartItems = [];
      return updateCart(state);
    }
    ,
    removePaidItems: (state, action) => {
      // action.payload: array of product ids to remove from cart
      const idsToRemove = Array.isArray(action.payload) ? action.payload.map(String) : [];
      if (idsToRemove.length === 0) return state;
      state.cartItems = state.cartItems.filter((x) => !idsToRemove.includes(String(x._id)));
      return updateCart(state);
    }
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  saveShippingAddress, 
  savePaymentMethod, 
  clearCartItems,
  removePaidItems,
} = cartSlice.actions;

export default cartSlice.reducer;
