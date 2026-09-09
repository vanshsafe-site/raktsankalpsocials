CREATE POLICY "Anyone can view social proof images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'social-proof');

CREATE POLICY "Signed-in admins can upload social proof images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'social-proof');

CREATE POLICY "Signed-in admins can update social proof images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'social-proof')
  WITH CHECK (bucket_id = 'social-proof');

CREATE POLICY "Signed-in admins can remove social proof images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'social-proof');