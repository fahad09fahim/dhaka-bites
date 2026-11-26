INSERT INTO restaurants (name, area, cuisine, address, latitude, longitude) VALUES
('Star Kabab & Restaurant', 'Dhanmondi', 'Bengali & Kabab', 'Satmasjid Road, Dhanmondi, Dhaka', 23.7461, 90.3742),
('Haji Biriyani', 'Old Dhaka', 'Traditional Biriyani', '70 Kazi Alauddin Road, Nazira Bazar, Dhaka', 23.7196, 90.4057),
('Sultan''s Dine', 'Gulshan', 'Kacchi & Mughlai', 'Gulshan-2 Circle, Dhaka', 23.7940, 90.4144),
('Takeout', 'Banani', 'Burgers & Fast Food', 'Road 11, Banani, Dhaka', 23.7937, 90.4043),
('North End Coffee Roasters', 'Gulshan', 'Cafe & Bakery', 'Shahjadpur, Pragati Sarani, Dhaka', 23.7916, 90.4254),
('Fakhruddin Biryani', 'Bailey Road', 'Kacchi & Bengali', 'Viqarunnisa Noon School Rd, Bailey Road, Dhaka', 23.7420, 90.4106)
ON CONFLICT DO NOTHING;
