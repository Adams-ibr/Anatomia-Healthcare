-- Older profile uploads stored the complete image data URL in Supabase Auth
-- user metadata. Auth embeds that metadata in every access token, which can
-- make Authorization headers exceed the hosting proxy's limit. Preserve the
-- image on the application profile, then remove only the oversized Auth claim.
update public.profiles as profile
set avatar = auth_user.raw_user_meta_data ->> 'avatar'
from auth.users as auth_user
where (profile.id = auth_user.id or lower(profile.email) = lower(auth_user.email))
  and coalesce(profile.avatar, '') = ''
  and auth_user.raw_user_meta_data ->> 'avatar' like 'data:image/%';

update auth.users as auth_user
set raw_user_meta_data = coalesce(auth_user.raw_user_meta_data, '{}'::jsonb) - 'avatar'
where auth_user.raw_user_meta_data ->> 'avatar' like 'data:image/%';
