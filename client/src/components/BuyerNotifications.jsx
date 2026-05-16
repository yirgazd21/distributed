import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaBoxOpen, FaBullhorn, FaUndoAlt } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useGetMyOrdersQuery } from '../store/slices/ordersApiSlice';
import { useGetPlatformUpdatesQuery } from '../store/slices/platformApiSlice';

const BuyerNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('buyerReadNotifications') || '[]'));
    } catch {
      return new Set();
    }
  });
  const dropdownRef = useRef(null);
  const { userInfo } = useSelector((state) => state.auth);
  const { data: orders = [] } = useGetMyOrdersQuery(undefined, {
    skip: !userInfo,
    pollingInterval: 30000,
  });
  const { data: updatesData } = useGetPlatformUpdatesQuery({ audience: 'buyer' }, { skip: !userInfo });

  const notifications = useMemo(() => {
    const orderUpdates = orders.flatMap((order) => {
      const items = [];
      if (order.isDelivered) {
        items.push({
          id: `delivered-${order._id}`,
          icon: FaBoxOpen,
          title: 'Order delivered',
          description: `Order #${String(order._id).slice(-8)} is marked delivered`,
          to: `/order/${order._id}`,
          tone: 'text-blue-500',
          timestamp: order.deliveredAt || order.updatedAt || order.createdAt,
        });
      }
      if (order.refundStatus === 'completed') {
        items.push({
          id: `refund-completed-${order._id}`,
          icon: FaUndoAlt,
          title: 'Refund accepted',
          description: `Refund completed for order #${String(order._id).slice(-8)}`,
          to: '/profile?tab=refunds',
          tone: 'text-green-500',
          timestamp: order.refundedAt || order.updatedAt || order.createdAt,
        });
      }
      if (order.refundStatus === 'rejected') {
        items.push({
          id: `refund-rejected-${order._id}`,
          icon: FaUndoAlt,
          title: 'Refund rejected',
          description: `Seller responded to order #${String(order._id).slice(-8)}`,
          to: '/profile?tab=refunds',
          tone: 'text-red-500',
          timestamp: order.refundedAt || order.updatedAt || order.createdAt,
        });
      }
      return items;
    });

    const platformUpdates = (updatesData?.updates || []).slice(0, 3).map((update) => ({
      id: `update-${update._id}`,
      icon: FaBullhorn,
      title: update.title || 'New update',
      description: update.message || 'There is a new platform update',
      to: '/profile?tab=dashboard',
      tone: 'text-emerald-500',
      timestamp: update.createdAt,
    }));

    return [...orderUpdates, ...platformUpdates]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);
  }, [orders, updatesData]);
  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length;

  const markNotificationRead = (notificationId) => {
    setReadIds((prev) => {
      const next = new Set([...prev, notificationId]);
      localStorage.setItem('buyerReadNotifications', JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userInfo) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative text-gray-600 dark:text-gray-200 hover:text-green-500 transition-colors"
      >
        <FaBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-black text-gray-900 dark:text-white">Notifications</p>
            <p className="text-xs text-gray-500">Delivery, refund, and update messages</p>
          </div>
          <div className="max-h-96 overflow-y-auto py-2">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">No new updates.</div>
            ) : (
              notifications.map((item) => {
                const ItemIcon = item.icon;
                const isRead = readIds.has(item.id);
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => {
                      markNotificationRead(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${isRead ? 'opacity-60' : ''}`}
                  >
                    <span className={`mt-1 ${item.tone}`}>
                      <ItemIcon />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">{item.title}</span>
                      <span className="block text-xs text-gray-500 line-clamp-2">{item.description}</span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerNotifications;
