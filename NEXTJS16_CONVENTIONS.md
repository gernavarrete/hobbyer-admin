# Next.js 16.2.1 — Convenciones del Orquestador para hobbyer-admin

> Este documento es la fuente de verdad para cualquier agente o tarea que toque el repo `hobbyer-admin`.
> Generado a partir de los docs internos de `node_modules/next/dist/docs/` + auditoría del código existente.

---

## 1. Contexto: por qué esto importa

El admin usa **Next.js 16.2.1** con **React 19.2.4**. Esta versión tiene breaking changes respecto
a Next.js 14/15. El entrenamiento de la mayoría de los modelos llega hasta Next.js 14 o early 15.
No asumir nada. Verificar aquí antes de escribir código.

---

## 2. Breaking Changes — lo que ya NO funciona

### 2.1 `middleware.ts` → `proxy.ts` (RENAMING OBLIGATORIO)

El archivo `middleware.ts` está **deprecado**. El nombre correcto ahora es `proxy.ts`.
El export también cambia:

```ts
// ❌ Next.js 14/15 — INCORRECTO en v16
export function middleware(request: Request) { ... }

// ✅ Next.js 16 — CORRECTO
export function proxy(request: Request) { ... }
```

Las config flags también cambian:
```ts
// ❌ Deprecado
skipMiddlewareUrlNormalize: true

// ✅ Correcto en v16
skipProxyUrlNormalize: true
```

> **Estado en hobbyer-admin:** No existe `middleware.ts` ni `proxy.ts` aún. Si se necesita
> route guard a nivel de red, crear `proxy.ts` con export `proxy`.

---

### 2.2 Async Request APIs — acceso sincrónico ELIMINADO (BREAKING)

En v15 el acceso sincrónico a estas APIs era "temporalmente compatible". En **v16 fue eliminado**.
Son TODAS asíncronas obligatoriamente:

| API | Incorrecto (v14) | Correcto (v16) |
|-----|-----------------|----------------|
| `cookies()` | `const c = cookies()` | `const c = await cookies()` |
| `headers()` | `const h = headers()` | `const h = await headers()` |
| `draftMode()` | `const d = draftMode()` | `const d = await draftMode()` |
| `params` en page/layout/route | `{ params: { id: string } }` | `{ params: Promise<{ id: string }> }` |
| `searchParams` en page | `{ searchParams: { q: string } }` | `{ searchParams: Promise<{ q: string }> }` |

**Patrón correcto en v16 para pages con params:**

```tsx
// ✅ v16 — params es una Promise
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // ...
}
```

**Usar `next typegen` para generar tipos automáticos:**
```bash
npx next typegen
```
Genera helpers `PageProps`, `LayoutProps`, `RouteContext` con tipos correctos para cada ruta.

> **Estado en hobbyer-admin:** Todas las páginas del dashboard son `'use client'` y no usan
> `params`/`searchParams` del lado servidor. Sin impacto directo hoy. Pero cualquier nueva
> Server Component o Route Handler DEBE seguir este patrón.

---

### 2.3 Turbopack por defecto (potencial impacto en builds)

Desde v16, `next dev` y `next build` usan **Turbopack por defecto**. No es necesario el flag `--turbopack`.

```json
// ❌ Ya no hace falta
{ "dev": "next dev --turbopack" }

// ✅ Simplificado
{ "dev": "next dev" }
```

**Riesgo:** Si hay una config `webpack` personalizada en `next.config.ts`, el build va a **fallar**.
Para continuar con Webpack usar `next build --webpack`.

La config de turbopack se movió de `experimental.turbopack` a nivel raíz:

```ts
// ❌ v15
const config = { experimental: { turbopack: { ... } } }

// ✅ v16
const config = { turbopack: { ... } }
```

> **Estado en hobbyer-admin:** `next.config.ts` está vacío. No hay webpack config. Turbopack
> funciona out of the box.

---

### 2.4 PPR — `experimental.ppr` eliminado

El flag `experimental.ppr: true` fue eliminado. El modo equivalente ahora es `cacheComponents`:

```ts
// ❌ v15 canary — ya no existe en v16
const config = { experimental: { ppr: true } }

// ✅ v16 — Partial Prerendering via cacheComponents
const config = { cacheComponents: true }
```

> **Estado en hobbyer-admin:** `cacheComponents` NO está habilitado. El admin no usa PPR.
> No activar sin necesidad — requiere refactor de caching model.

---

### 2.5 `next/image` — cambios de defaults

| Cambio | Antes | Ahora |
|--------|-------|-------|
| `minimumCacheTTL` default | 60 segundos | 4 horas (14400s) |
| `imageSizes` default | incluía `16` | `16` eliminado del array |
| Local images con query strings | funcionaban | requieren `images.localPatterns.search` |

---

## 3. Nuevas APIs estabilizadas en v16

### 3.1 `unstable_` prefijos eliminados

```ts
// ❌ Prefijo viejo (v14/v15)
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'

// ✅ Estable en v16
import { cacheLife, cacheTag } from 'next/cache'
```

### 3.2 Nuevas APIs de cache

```ts
import { updateTag, refresh, revalidateTag } from 'next/cache'
```

| API | Cuándo usar |
|-----|-------------|
| `updateTag(tag)` | En Server Actions: el usuario hace un cambio y VE el resultado inmediatamente. Expira y recarga en el mismo request. |
| `revalidateTag(tag, profile?)` | Invalidación eventual — el próximo visitante verá datos frescos, el actual puede ver stale. |
| `refresh()` | Recarga el client router desde una Server Action, sin invalidar cache. |

### 3.3 `use cache` directive (nuevo modelo de caching)

Reemplaza el modelo anterior de `fetch({ cache: 'force-cache' })`:

```ts
// Cache a nivel de función de datos
import { cacheLife } from 'next/cache'

export async function getUsers() {
  'use cache'
  cacheLife('hours') // profiles: seconds | minutes | hours | days | weeks | max
  return db.query('SELECT * FROM users')
}

// Cache a nivel de componente/página
export default async function Page() {
  'use cache'
  cacheLife('hours')
  // ...
}
```

> `use cache` NO puede usarse directamente en el body de un Route Handler.
> Extraerlo a una función helper.

```ts
// ❌ Incorrecto
export async function GET() {
  'use cache' // NO funciona aquí
  return Response.json(await db.query('...'))
}

// ✅ Correcto
export async function GET() {
  const data = await getCachedData()
  return Response.json(data)
}

async function getCachedData() {
  'use cache'
  cacheLife('hours')
  return db.query('...')
}
```

---

## 4. React 19.2 — features disponibles

El App Router de Next.js 16 usa **React 19.2**. Features nuevos:

| Feature | API | Uso |
|---------|-----|-----|
| View Transitions | `<ViewTransition>` | Animar elementos en navegaciones o dentro de Transitions |
| Effect Events | `useEffectEvent` | Extraer lógica no-reactiva de un `useEffect` a una función reutilizable |
| Activity | `<Activity>` | Renderizar UI "en background" con `display: none` sin perder estado |

### React Compiler (opt-in estable)

Auto-memoiza componentes. No requiere `useMemo`/`useCallback` manual.

```ts
// next.config.ts
const config = { reactCompiler: true }
```

> Requiere `babel-plugin-react-compiler` como devDependency.
> Aumenta tiempos de compilación. Evaluar antes de activar.

---

## 5. Modelo de rendering — cómo aplica al admin

El admin usa **Client Components exclusivamente** para las páginas del dashboard. Esto es
correcto y deliberado: los datos del admin requieren frescura en cada interacción.

### Regla de oro para este proyecto:

```
Dashboard pages = 'use client' + Axios (lib/api.ts) + React Query o useEffect
Route Handlers (/api/*) = Server-side, sin 'use client'
```

### Cuándo usar Server Components en el admin

Solo para wrappers/layouts que NO necesitan interactividad ni datos del backend:

```tsx
// ✅ Server Component válido — solo estructura
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex">{children}</div>
}

// ✅ Server Component válido — fetch de datos estáticos o con cache
export default async function Page() {
  'use cache'
  cacheLife('hours')
  const config = await getStaticConfig()
  return <ConfigDisplay config={config} />
}
```

### Cuándo NO usar Server Components en el admin

- Componentes que leen de `localStorage` (token de auth)
- Componentes con `useState`, `useEffect`, `onClick`
- Componentes que consumen el Axios client de `lib/api.ts`
- Todo lo que está en `app/dashboard/**`

---

## 6. Route Handlers — convenciones

Ubicación: `app/api/[...]/route.ts`

```ts
// Typing con RouteContext helper (generado por next typegen)
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/users/[id]'>) {
  const { id } = await ctx.params  // params es Promise en v16
  return Response.json({ id })
}
```

- `GET` Route Handlers NO están cacheados por default.
- Para cachear un GET: `export const dynamic = 'force-static'` o usar `use cache` en función helper.
- `POST`, `PUT`, `PATCH`, `DELETE` nunca se cachean.

---

## 7. Proxy (route guard) — cómo implementar en v16

Si se necesita proteger rutas sin autenticación (redirect a `/login`):

```ts
// proxy.ts (NOT middleware.ts)
import { type NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('hobbyer_admin_token')
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

> **Runtime:** El runtime de `proxy` es `nodejs`. El runtime `edge` NO está soportado en `proxy`.
> Si se necesita `edge`, usar `middleware.ts` (deprecado pero funcional aún para edge).

---

## 8. Cheatsheet rápido para el Orquestador

| Necesito... | Hacer esto en v16 |
|-------------|-------------------|
| Route guard / redirect sin auth | `proxy.ts` con export `proxy` |
| Leer cookies en Server Component | `const c = await cookies()` |
| Leer params de URL en page/layout | `const { id } = await params` |
| Cachear datos en Server Component | `'use cache'` + `cacheLife('hours')` |
| Cachear datos en Route Handler | función helper con `'use cache'` |
| Invalidar cache con "read your writes" | `updateTag(tag)` en Server Action |
| Invalidar cache eventual | `revalidateTag(tag)` en Server Action |
| Refrescar client router | `refresh()` en Server Action |
| Importar cacheLife/cacheTag | `from 'next/cache'` (sin `unstable_`) |
| Tipar params de página | `params: Promise<{ id: string }>` o `PageProps<'/ruta/[id]'>` |
| Configurar turbopack | Top-level `turbopack: {}` en `next.config.ts` |
| Feature flag de React Compiler | `reactCompiler: true` en `next.config.ts` |

---

## 9. Lo que NO cambió (sigue igual desde v14/v15)

- App Router con `app/` directory — misma estructura
- `layout.tsx` / `page.tsx` / `loading.tsx` / `error.tsx` file conventions
- `'use client'` directive para Client Components
- `Link`, `Image`, `useRouter`, `usePathname` de `next/navigation`
- Server Actions con `'use server'`
- `<Suspense>` boundaries
- `next/headers` con `cookies()` y `headers()` (solo cambia que ahora son async)

---

*Fuente: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` +
`node_modules/next/dist/docs/01-app/01-getting-started/*.md` + auditoría del código existente.*
*Última actualización: 2026-04-01*
