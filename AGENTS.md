<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Order creation goes only through `createOrder` server fn, which re-reads prices from the DB — never trust client prices.
- Admin rights live in `public.user_roles` checked via `has_role()`; the first signed-up user becomes admin via trigger.
- UI strings live in `src/lib/i18n.tsx` (mk/en) — add both languages for every new string.
