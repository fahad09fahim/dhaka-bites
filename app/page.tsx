'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthModal from '@/components/AuthModal';
import type { Restaurant } from '@/components/DhakaMap';

const DhakaMap = dynamic(() => import('@/components/DhakaMap'), { ssr: false });

interface User {
  id: string;
  full_name: string;
  is_verified: boolean;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  food_quality: number;
  price_impression: string;
  comment: string;
  created_at: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Search & Area Filter
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');

  // Review form state
  const [rating, setRating] = useState(5);
  const [foodQuality, setFoodQuality] = useState(5);
  const [priceImpression, setPriceImpression] = useState('Moderate');
  const [comment, setComment] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  // Add restaurant state
  const [newRest, setNewRest] = useState({
    name: '', area: 'Dhanmondi', cuisine: '', address: '', latitude: '23.7461', longitude: '90.3742'
  });

  const loadUser = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
  }, []);

  const loadRestaurants = useCallback(async () => {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    setRestaurants(data.restaurants || []);
  }, []);

  const loadReviews = useCallback(async (restaurantId: string) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/reviews`);
    const data = await res.json();
    setReviews(data.reviews || []);
  }, []);

  useEffect(() => {
    loadUser();
    loadRestaurants();
  }, [loadUser, loadRestaurants]);

  useEffect(() => {
    if (selected) loadReviews(selected.id);
  }, [selected, loadReviews]);

  const areas = useMemo(
    () => ['All', ...Array.from(new Set(restaurants.map((r) => r.area))).sort()],
    [restaurants]
  );

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesArea = areaFilter === 'All' || r.area === areaFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.area.toLowerCase().includes(q);
      return matchesArea && matchesSearch;
    });
  }, [restaurants, areaFilter, search]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitMsg('');

    const res = await fetch(`/api/restaurants/${selected.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, foodQuality, priceImpression, comment }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitMsg(data.error);
      return;
    }

    setComment('');
    setSubmitMsg('Review published!');
    await Promise.all([loadRestaurants(), loadReviews(selected.id)]);
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newRest,
        latitude: parseFloat(newRest.latitude),
        longitude: parseFloat(newRest.longitude),
      }),
    });
    if (res.ok) {
      setShowAddModal(false);
      setNewRest({ name: '', area: 'Dhanmondi', cuisine: '', address: '', latitude: '23.7461', longitude: '90.3742' });
      loadRestaurants();
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍛</span>
            <h1 className="text-xl font-extrabold text-orange-600">Dhaka Bites</h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {user?.is_verified && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-medium hover:bg-orange-100"
              >
                + Add Restaurant
              </button>
            )}
            {user ? (
              <>
                <span className="font-medium">
                  {user.full_name}{' '}
                  {user.is_verified ? (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">Verified</span>
                  ) : (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">Unverified</span>
                  )}
                </span>
                <button onClick={handleLogout} className="px-3 py-1.5 border rounded-lg hover:bg-gray-100">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium">
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Search restaurants or cuisines in Dhaka..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm"
            />
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {areas.map((area) => (
                <option key={area} value={area}>{area === 'All' ? 'All Dhaka Areas' : area}</option>
              ))}
            </select>
          </div>

          <DhakaMap restaurants={filteredRestaurants} selectedId={selected?.id ?? null} onSelect={setSelected} />

          <div className="grid sm:grid-cols-2 gap-4">
            {filteredRestaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`text-left p-4 bg-white rounded-xl border transition ${
                  selected?.id === r.id ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{r.name}</h3>
                    <p className="text-xs text-gray-500">{r.area} · {r.cuisine}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold">
                    ★ {r.avg_rating > 0 ? r.avg_rating : 'New'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Food Quality: {r.avg_food_quality > 0 ? `${r.avg_food_quality}/5` : '—'} · {r.review_count} reviews
                </p>
              </button>
            ))}
          </div>
        </section>

        <aside className="bg-white rounded-xl border border-gray-200 p-5 h-fit space-y-5">
          {!selected ? (
            <p className="text-sm text-gray-500 text-center py-10">
              Select a restaurant on the Dhaka map or list to view ratings and submit a review.
            </p>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.address}</p>
                <div className="mt-2 flex gap-3 text-sm font-semibold">
                  <span className="text-orange-600">★ {selected.avg_rating || 'No ratings'}</span>
                  <span className="text-gray-600">Food: {selected.avg_food_quality || '—'}/5</span>
                </div>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">Write a Review</h3>
                {!user?.is_verified && (
                  <p className="text-xs bg-amber-50 text-amber-800 p-2 rounded">
                    Complete registration (OTP + QR Face Demo) to submit reviews.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="space-y-1">
                    <span>Overall Stars (1–5)</span>
                    <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full border rounded p-2">
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span>Food Quality (1–5)</span>
                    <select value={foodQuality} onChange={(e) => setFoodQuality(Number(e.target.value))} className="w-full border rounded p-2">
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
                    </select>
                  </label>
                </div>

                <label className="block text-xs space-y-1">
                  <span>Price Impression</span>
                  <select value={priceImpression} onChange={(e) => setPriceImpression(e.target.value)} className="w-full border rounded p-2">
                    {['Budget', 'Moderate', 'Pricey', 'Luxury'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>

                <textarea
                  rows={3}
                  placeholder="Share your dining experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />

                {submitMsg && <p className="text-xs text-orange-700">{submitMsg}</p>}

                <button
                  disabled={!user?.is_verified}
                  className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
                >
                  Submit Review
                </button>
              </form>

              <div className="border-t pt-4 space-y-3 max-h-80 overflow-y-auto">
                <h3 className="font-semibold text-sm">Reviews ({reviews.length})</h3>
                {reviews.length === 0 ? (
                  <p className="text-xs text-gray-400">No reviews yet. Be the first verified diner!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{rev.reviewer_name}</span>
                        <span className="text-orange-600">★ {rev.rating} · {rev.price_impression}</span>
                      </div>
                      <p className="text-gray-500">Food Quality: {rev.food_quality}/5</p>
                      <p className="text-gray-800">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthChange={loadUser} />}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddRestaurant} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Add Dhaka Restaurant</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400">✕</button>
            </div>
            <input placeholder="Restaurant Name" value={newRest.name} onChange={(e) => setNewRest({ ...newRest, name: e.target.value })} className="w-full border rounded-lg p-2 text-sm" required />
            <input placeholder="Area (e.g., Dhanmondi, Gulshan, Uttara)" value={newRest.area} onChange={(e) => setNewRest({ ...newRest, area: e.target.value })} className="w-full border rounded-lg p-2 text-sm" required />
            <input placeholder="Cuisine (e.g., Kacchi, Cafe, Burgers)" value={newRest.cuisine} onChange={(e) => setNewRest({ ...newRest, cuisine: e.target.value })} className="w-full border rounded-lg p-2 text-sm" required />
            <input placeholder="Full Address" value={newRest.address} onChange={(e) => setNewRest({ ...newRest, address: e.target.value })} className="w-full border rounded-lg p-2 text-sm" required />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Latitude" value={newRest.latitude} onChange={(e) => setNewRest({ ...newRest, latitude: e.target.value })} className="border rounded-lg p-2 text-sm" required />
              <input placeholder="Longitude" value={newRest.longitude} onChange={(e) => setNewRest({ ...newRest, longitude: e.target.value })} className="border rounded-lg p-2 text-sm" required />
            </div>
            <button className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium text-sm">Save Restaurant</button>
          </form>
        </div>
      )}
    </div>
  );
}
