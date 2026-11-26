import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const { rows } = await pool.query(`
    SELECT
      r.id, r.name, r.area, r.cuisine, r.address, r.latitude, r.longitude,
      COALESCE(ROUND(AVG(rev.rating)::numeric, 1), 0)::float AS avg_rating,
      COALESCE(ROUND(AVG(rev.food_quality)::numeric, 1), 0)::float AS avg_food_quality,
      COUNT(rev.id)::int AS review_count
    FROM restaurants r
    LEFT JOIN reviews rev ON rev.restaurant_id = r.id
    GROUP BY r.id
    ORDER BY avg_rating DESC, r.name ASC
  `);

  return NextResponse.json({ restaurants: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.is_verified) {
    return NextResponse.json({ error: 'Only verified users can add restaurants.' }, { status: 403 });
  }

  const { name, area, cuisine, address, latitude, longitude } = await req.json();
  if (!name || !area || !cuisine || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json({ error: 'All restaurant fields and valid coordinates are required.' }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO restaurants (name, area, cuisine, address, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name.trim(), area.trim(), cuisine.trim(), address.trim(), latitude, longitude]
  );

  return NextResponse.json({ restaurant: rows[0] }, { status: 201 });
}
