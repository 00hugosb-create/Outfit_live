# Outfit Live (Next.js + Supabase + Vercel)

## 1. Supabase
1. Crea un proyecto en supabase.com.
2. SQL Editor → pega `supabase.sql` → Run.
3. Authentication → Sign In / Providers → desactiva "Allow new users to sign up".
4. Authentication → Users → Add user (tu email y contraseña, marca "Auto confirm").
5. Project Settings → API: copia la **Project URL** y la clave **anon / publishable**.

## 2. GitHub
Sube esta carpeta a un repositorio nuevo.

## 3. Vercel
Add New → Project → importa el repo → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave anon
→ Deploy.

## Probar en local (opcional)
Crea `.env.local` con las dos variables, luego `npm install && npm run dev`.
