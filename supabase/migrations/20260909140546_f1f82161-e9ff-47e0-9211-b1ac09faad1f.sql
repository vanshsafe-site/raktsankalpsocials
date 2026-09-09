CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  posted BOOLEAN NOT NULL DEFAULT false,
  post_url TEXT,
  screenshot_url TEXT,
  screenshot_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT social_posts_date_platform_key UNIQUE (date, platform),
  CONSTRAINT social_posts_platform_check CHECK (platform IN ('youtube', 'instagram', 'facebook', 'twitter', 'linkedin'))
);

GRANT SELECT ON public.social_posts TO anon;
GRANT SELECT ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social posting activity"
  ON public.social_posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX social_posts_date_idx ON public.social_posts (date);
CREATE INDEX social_posts_date_platform_idx ON public.social_posts (date, platform);

CREATE OR REPLACE FUNCTION public.update_social_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_social_posts_updated_at();

COMMENT ON TABLE public.social_posts IS 'Daily social media posting activity and proof records for Raktsankalp.';
COMMENT ON COLUMN public.social_posts.date IS 'Calendar date for the post, stored without timezone.';
COMMENT ON COLUMN public.social_posts.platform IS 'One of youtube, instagram, facebook, twitter, or linkedin.';
COMMENT ON COLUMN public.social_posts.post_url IS 'Optional public URL to the published post.';
COMMENT ON COLUMN public.social_posts.screenshot_url IS 'Optional public URL to uploaded proof image.';
COMMENT ON COLUMN public.social_posts.screenshot_path IS 'Storage path for the uploaded proof image.';