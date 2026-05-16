import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar } from 'react-icons/fa';
import { BASE_URL } from '../store/slices/apiSlice';
import {
  useAddToFavoritesMutation,
  useGetUserFavoritesQuery,
  useRemoveFromFavoritesMutation,
} from '../store/slices/usersApiSlice';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { data: favorites = [] } = useGetUserFavoritesQuery(undefined, { skip: !userInfo });
  const [addToFavorites, { isLoading: addingFavorite }] = useAddToFavoritesMutation();
  const [removeFromFavorites, { isLoading: removingFavorite }] = useRemoveFromFavoritesMutation();
  const isFavorite = favorites.some((favorite) => String(favorite.id) === String(product._id));

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const addToCartHandler = (e) => {
    e.preventDefault(); 
    if (product.countInStock > 0) {
      dispatch(addToCart({
        ...product,
        selectedImage: product.image,
        cartItemId: `${product._id}-${product.image}`,
        qty: 1,
      }));
      toast.success(`${product.name} added to cart!`);
    }
  };

  const favoriteHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userInfo) {
      toast.info('Please log in to save favorites');
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(product._id).unwrap();
        toast.success('Removed from favorites');
      } else {
        await addToFavorites(product._id).unwrap();
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to update favorite');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-300 flex flex-col h-full group">
      
      {/* 🖼️ Image Section - Minimized */}
      <Link to={`/product/${product._id}`} className="relative block h-40 bg-gray-50 dark:bg-slate-800 overflow-hidden">
        <img 
          src={`${BASE_URL}${product.image}`} 
          alt={product.name} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <button
          type="button"
          onClick={favoriteHandler}
          disabled={addingFavorite || removingFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-all ${
            isFavorite
              ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
              : 'border-gray-200 bg-white/90 text-gray-400 hover:border-red-200 hover:text-red-500'
          } disabled:opacity-60`}
        >
          {isFavorite ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
        </button>
        
        {/* Discount Badge - Smaller */}
        {discountPercentage > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-[#ff0036] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            -{discountPercentage}%
          </div>
        )}

        {/* Out of Stock Badge */}
        {product.countInStock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
             <span className="bg-gray-900 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
               Sold Out
             </span>
          </div>
        )}
      </Link>

      {/* 📝 Details Section - Compact */}
      <div className="p-2.5 flex flex-col flex-grow bg-white dark:bg-slate-900">
        
        {/* Title - Smaller */}
        <Link to={`/product/${product._id}`}>
          <h3 className="text-xs font-medium text-gray-800 dark:text-slate-100 line-clamp-2 hover:text-[#ff0036] transition-colors leading-tight mb-1.5 min-h-[2rem]">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2 min-h-[2rem]">
            {product.description}
          </p>
        )}

        {/* Rating Section - Compact */}
        <div className="flex items-center gap-1 mb-2">
          <FaStar className="text-yellow-400 text-[10px]" />
          <span className="text-[10px] font-bold text-gray-700 dark:text-slate-200">
            {product.rating ? product.rating.toFixed(1) : '0.0'}
          </span>
          <span className="text-[10px] text-gray-400">({product.numReviews})</span>
        </div>

        {/* Price & Action Row - Compact */}
        <div className="mt-auto flex items-end justify-between">
          
          {/* Price Block */}
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-bold text-[#ff0036]">ETB</span>
              <span className="text-base font-black text-[#ff0036] leading-none">
                {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            {/* Original Price */}
            <div className="h-3 mt-0.5">
              {discountPercentage > 0 && (
                <span className="text-[9px] text-gray-400 line-through">
                  ETB {product.originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          {/* Compact Cart Button */}
          <button 
            onClick={addToCartHandler}
            disabled={product.countInStock === 0}
            title="Add to Cart"
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              product.countInStock === 0 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-red-50 text-[#ff0036] hover:bg-[#ff0036] hover:text-white'
            }`}
          >
            <FaShoppingCart size={11} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ProductCard;