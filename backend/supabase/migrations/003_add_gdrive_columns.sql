-- Add photo columns to attendances
ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS check_in_photo_url TEXT,
ADD COLUMN IF NOT EXISTS check_out_photo_url TEXT;

-- Add location columns to leave_requests
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add comments for documentation
COMMENT ON COLUMN public.attendances.check_in_photo_url IS 'Google Drive URL for check-in photo';
COMMENT ON COLUMN public.attendances.check_out_photo_url IS 'Google Drive URL for check-out photo';
COMMENT ON COLUMN public.leave_requests.latitude IS 'Latitude when requesting leave';
COMMENT ON COLUMN public.leave_requests.longitude IS 'Longitude when requesting leave';
