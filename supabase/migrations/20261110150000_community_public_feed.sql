-- Comunidad pública en la web: cualquiera puede ver las publicaciones visibles y sus
-- comentarios sin iniciar sesión. Solo lectura; reaccionar, comentar y publicar sigue
-- requiriendo la cuenta Peluvi. No expone datos privados: solo nombre visible, avatar,
-- texto, fotos/videos (ya públicos en el bucket community-media) y contadores.

create or replace function public.community_public_feed(p_before timestamptz default null, p_limit integer default 10, p_author uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc), '[]'::jsonb)
    from (
      select p.id, p.caption, p.media, p.reaction_count, p.comment_count, p.created_at,
             false as hidden,
             coalesce(nullif(a.business_name, ''), a.name, 'Usuario Peluvi') as author_name,
             a.avatar_url as author_avatar,
             case when a.role = 'provider' then a.provider_type end as author_business_type
        from public.community_posts p
        join public.profiles a on a.id = p.author_id
       where not p.hidden
         and (p_author is null or p.author_id = p_author)
         and (p_before is null or p.created_at < p_before)
       order by p.created_at desc
       limit least(greatest(coalesce(p_limit, 10), 1), 30)
    ) x;
$$;

create or replace function public.community_public_comments(p_post uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(x) order by x.created_at), '[]'::jsonb)
    from (
      select c.id, c.body, c.created_at,
             coalesce(nullif(a.business_name, ''), a.name, 'Usuario Peluvi') as author_name,
             a.avatar_url as author_avatar
        from public.community_comments c
        join public.community_posts p on p.id = c.post_id and not p.hidden
        join public.profiles a on a.id = c.author_id
       where c.post_id = p_post
         and not c.hidden
       order by c.created_at
       limit 200
    ) x;
$$;

revoke all on function public.community_public_feed(timestamptz, integer, uuid) from public;
revoke all on function public.community_public_comments(uuid) from public;
grant execute on function public.community_public_feed(timestamptz, integer, uuid) to anon, authenticated;
grant execute on function public.community_public_comments(uuid) to anon, authenticated;
