import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useCreateOrderMutation, useInitializeChapaPaymentMutation } from '../store/slices/ordersApiSlice';
import { clearCartItems } from '../store/slices/cartSlice';
import CheckoutSteps from '../components/CheckoutSteps';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaCreditCard, FaShoppingBag } from 'react-icons/fa';
import Loader from '../components/Loader';
import { BASE_URL } from '../store/slices/apiSlice';

const PlaceOrderScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart) || {};
  const { userInfo } = useSelector((state) => state.auth) || {};

  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [initializeChapaPayment, { isLoading, error }] = useInitializeChapaPaymentMutation();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Safe cart values with defaults
  const cartItems = cart?.cartItems || [];
  const shippingAddress = cart?.shippingAddress || {};
  const paymentMethod = cart?.paymentMethod || '';
  const itemsPrice = cart?.itemsPrice || 0;
  const shippingPrice = cart?.shippingPrice || 0;
  const taxPrice = cart?.taxPrice || 0;
  const totalPrice = cart?.totalPrice || 0;

  useEffect(() => {
    if (!shippingAddress?.address) {
      navigate('/shipping');
    } else if (!paymentMethod) {
      navigate('/payment');
    }
  }, [shippingAddress, paymentMethod, navigate]);

  const placeOrderHandler = async () => {
    if (!shippingAddress?.address) {
      toast.error('Shipping address missing');
      return;
    }

    if (!paymentMethod) {
      toast.error('Payment method missing');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // CASH ON DELIVERY — create order directly
    if (paymentMethod !== 'Chapa') {
      try {
        const order = await createOrder({
          orderItems: cartItems,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          shippingPrice,
          taxPrice,
          totalPrice,
        }).unwrap();
        dispatch(clearCartItems());
        navigate(`/order/${order._id}`);
      } catch (err) {
        toast.error(err?.data?.message || 'Order creation failed');
      }
      return;
    }

    // CHAPA — order is created inside initializeChapaPayment on the backend
    setIsProcessingPayment(true);
    try {
      const tx_ref = `gulit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const fullName = userInfo?.name || 'Gulit Customer';
      const firstName = fullName.split(' ')[0] || 'Gulit';
      const lastName = fullName.split(' ').slice(1).join(' ') || 'Customer';

      // Sanitize cart items — ensure all required fields are plain serializable objects
      const sanitizedItems = cartItems.map((item) => ({
        _id: item._id,
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        user: item.user,
        seller: item.seller,
        countInStock: item.countInStock,
      }));

      console.log('Sending orderItems:', sanitizedItems.length, sanitizedItems);

      const payload = {
        // Payment info
        amount: Math.round(Number(totalPrice)).toString(),
        email: userInfo?.email || 'customer@gulit.com',
        first_name: firstName,
        last_name: lastName,
        tx_ref,
        // Cart data — backend creates the order
        orderItems: sanitizedItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      };

      const res = await initializeChapaPayment(payload).unwrap();

      const checkoutUrl = res?.checkout_url;
      if (checkoutUrl) {
        // Store tx_ref and orderId so OrderSuccessScreen can recover them
        // even if Chapa uses a different param name in the return URL
        localStorage.setItem('pendingTxRef', tx_ref);
        localStorage.setItem('pendingOrderId', res?.orderId || '');
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received from Chapa');
      }
    } catch (err) {
      console.error('Chapa init error:', err);
      toast.error(err?.data?.message || err?.message || 'Payment initialization failed');
      setIsProcessingPayment(false);
    }
  };

  const paySingleItem = async (item) => {
    if (!userInfo) return toast.error('Please login first');
    try {
      setIsProcessingPayment(true);

      const tx_ref = `gulit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const fullName = userInfo?.name || 'Gulit Customer';
      const firstName = fullName.split(' ')[0] || 'Gulit';
      const lastName = fullName.split(' ').slice(1).join(' ') || 'Customer';

      // compute proportional shipping and tax for this item
      const itemTotal = Number((item.price || 0) * (item.qty || 1));
      const itemsPriceTotal = Number(itemsPrice || 0) || 1;
      const shippingForItem = itemsPriceTotal > 0 ? (Number(shippingPrice || 0) * (itemTotal / itemsPriceTotal)) : 0;
      const taxForItem = itemsPriceTotal > 0 ? (Number(taxPrice || 0) * (itemTotal / itemsPriceTotal)) : 0;
      const totalForItem = Math.round(itemTotal + shippingForItem + taxForItem);

      const sanitizedItem = {
        _id: item._id,
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        user: item.user,
        seller: item.seller,
        countInStock: item.countInStock,
      };

      const payload = {
        amount: totalForItem.toString(),
        email: userInfo?.email || 'customer@gulit.com',
        first_name: firstName,
        last_name: lastName,
        tx_ref,
        orderItems: [sanitizedItem],
        shippingAddress,
        paymentMethod,
        itemsPrice: itemTotal,
        shippingPrice: Number(shippingForItem.toFixed(2)),
        taxPrice: Number(taxForItem.toFixed(2)),
        totalPrice: totalForItem,
      };

      const res = await initializeChapaPayment(payload).unwrap();
      const checkoutUrl = res?.checkout_url;
      if (checkoutUrl) {
        localStorage.setItem('pendingTxRef', tx_ref);
        localStorage.setItem('pendingOrderId', res?.orderId || '');
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received from Chapa');
      }
    } catch (err) {
      console.error('Chapa init error:', err);
      toast.error(err?.data?.message || err?.message || 'Payment initialization failed');
      setIsProcessingPayment(false);
    }
  };

  // Safe render with checks
  if (!cart) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <CheckoutSteps step1 step2 step3 step4 />

      <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="md:col-span-2 space-y-6">

          {/* SHIPPING */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-bold flex gap-2 items-center">
              <FaMapMarkerAlt className="text-green-500" /> Shipping
            </h2>

            <p className="text-gray-600 mt-2">
              {shippingAddress?.address ? (
                <>
                  {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.country}
                  <br />
                  {shippingAddress.phoneNumber}
                </>
              ) : (
                'No address'
              )}
            </p>
          </div>

          {/* PAYMENT */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-bold flex gap-2 items-center">
              <FaCreditCard className="text-green-500" /> Payment
            </h2>
            <p className="text-gray-600 mt-2">{paymentMethod || 'Not selected'}</p>
          </div>

          {/* ITEMS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-bold flex gap-2 items-center">
              <FaShoppingBag className="text-green-500" /> Items
            </h2>

            {!cartItems || cartItems.length === 0 ? (
              <p className="text-red-500">Cart empty</p>
            ) : (
              cartItems.map((item, i) => (
                <div key={i} className="flex justify-between border-b py-3">
                  <div className="flex gap-3 items-center">
                    <img
                      src={`${BASE_URL}${item.image}`}
                      className="w-12 h-12 rounded"
                      alt={item.name || 'Product'}
                      onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                    <Link to={`/product/${item._id}`}>
                      {item.name || 'Product'}
                    </Link>
                  </div>
                  <div>
                    {item.qty || 0} x {item.price || 0}
                    {paymentMethod === 'Chapa' && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => paySingleItem(item)}
                          disabled={isProcessingPayment}
                          className="ml-2 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
                        >
                          Pay for this item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white p-6 rounded-2xl shadow border h-fit sticky top-20">

          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items</span>
              <span>ETB {itemsPrice}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>ETB {shippingPrice}</span>
            </div>

            <div className="flex justify-between">
              <span>Tax</span>
              <span>ETB {taxPrice}</span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-green-600">ETB {totalPrice}</span>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error?.data?.message || error.error || 'An error occurred'}
            </p>
          )}

          <button
            onClick={placeOrderHandler}
            disabled={isLoading || isCreatingOrder || isProcessingPayment || !cartItems || cartItems.length === 0}
            className="w-full mt-5 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessingPayment ? <Loader /> : 'Place Order'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PlaceOrderScreen;