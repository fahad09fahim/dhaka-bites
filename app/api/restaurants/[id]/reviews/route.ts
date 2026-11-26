import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { rows } = await pool.query(
    `SELECT rev.id, rev.rating, rev.food_quality, rev.price_impression, rev.comment, rev.created_at,
            u.full_name AS reviewer_name
     FROM reviews rev
     JOIN users u ON u.id = rev.user_id
     WHERE rev.restaurant_id = $1
     ORDER BY rev.created_at DESC`,
    [id]
  );

  return NextResponse.json({ reviews: rows });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in to submit a review.' }, { status: 401 });
  if (!user.is_verified) {
    return NextResponse.json(
      { error: 'Only fully verified users (OTP + Face Verification) can submit reviews.' },
      { status: 403 }
    );
  }

  const { id: restaurantId } = await context.params;
  const { rating, foodQuality, priceImpression, comment } = await req.json();

  if (
    rating < 1 || rating > 5 ||
    foodQuality < 1 || foodQuality > 5 ||
    !['Budget', 'Moderate', 'Pricey', 'Luxury'].includes(priceImpression) ||
    !comment?.trim()
  ) {
    return NextResponse.json({ error: 'Invalid review fields.' }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO reviews (restaurant_id, user_id, rating, food_quality, price_impression, comment)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (restaurant_id, user_id)
     DO UPDATE SET rating = EXCLUDED.rating, food_quality = EXCLUDED.food_quality,
                   price_impression = EXCLUDED.price_impression, comment = EXCLUDED.comment,
                   created_at = NOW()
     RETURNING *`,
    [restaurantId, user.id, rating, foodQuality, priceImpression, comment.trim()]
  );

  return NextResponse.json({ review: rows[0] }, { status: 201 });
}
