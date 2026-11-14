-- Fix dead source.unsplash.com and missing CDN cover URLs with stable pinned images.
UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop'
WHERE category = 'astrology' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');

UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=400&fit=crop'
WHERE category = 'spirituality' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');

UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=400&fit=crop'
WHERE category = 'vastu' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');

UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop'
WHERE category = 'numerology' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');

UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1509245853830-fb36a1f1f1c1?w=800&h=400&fit=crop'
WHERE category = 'tarot' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');

UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=400&fit=crop'
WHERE category = 'palmistry' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');

UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=400&fit=crop'
WHERE category = 'relationships' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');

UPDATE articles SET cover_image_url = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop'
WHERE category = 'career' AND (cover_image_url LIKE '%source.unsplash.com%' OR cover_image_url LIKE '%images.pandittalk.com%');
