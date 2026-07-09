truncate table public."extra tokens";

with candidates as (
  select
    (
      substring(md5('fruishy-extra-token-id-20260708-' || series::text), 1, 8) || '-' ||
      substring(md5('fruishy-extra-token-id-20260708-' || series::text), 9, 4) || '-' ||
      substring(md5('fruishy-extra-token-id-20260708-' || series::text), 13, 4) || '-' ||
      substring(md5('fruishy-extra-token-id-20260708-' || series::text), 17, 4) || '-' ||
      substring(md5('fruishy-extra-token-id-20260708-' || series::text), 21, 12)
    )::uuid as id,
    (
      substring(md5('fruishy-extra-token-qr-20260708-' || series::text), 1, 8) || '-' ||
      substring(md5('fruishy-extra-token-qr-20260708-' || series::text), 9, 4) || '-' ||
      substring(md5('fruishy-extra-token-qr-20260708-' || series::text), 13, 4) || '-' ||
      substring(md5('fruishy-extra-token-qr-20260708-' || series::text), 17, 4) || '-' ||
      substring(md5('fruishy-extra-token-qr-20260708-' || series::text), 21, 12)
    )::varchar as qr_token
  from generate_series(1, 5000) as series
), filtered as (
  select candidates.id, candidates.qr_token
  from candidates
  where not exists (
    select 1 from public.users u where u.qr_token = candidates.qr_token
  )
)
insert into public."extra tokens" (id, qr_token, is_occupied)
select filtered.id, filtered.qr_token, false
from filtered;

do $$
begin
  if (select count(*) from public."extra tokens") <> 5000 then
    raise exception 'Expected 5000 extra tokens after QR batch alignment.';
  end if;
end $$;
