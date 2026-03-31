# Hobbyer Admin Dashboard — Roadmap completo

> Panel web de administración centralizado para gestionar usuarios, partners, métricas, revenue y moderación.
> Dominio objetivo: `admin.hobbyer.com`

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 14 (App Router) + TypeScript | SSR para SEO, RSC para performance, routing nativo |
| UI | shadcn/ui + Tailwind CSS | Componentes accesibles, rápido de customizar |
| Gráficos | Recharts + Tremor | Recharts flexible, Tremor para dashboards pre-armados |
| Estado/fetch | TanStack Query (React Query) | Cache, polling, invalidación automática |
| Formularios | React Hook Form + Zod | Validación en cliente con el mismo esquema del backend |
| Auth | AWS Cognito (mismo User Pool de la app) + roles claim | Reutiliza infra existente |
| Deploy | Vercel | CI/CD gratis, preview por PR, dominio custom |
| API | FastAPI existente + nuevos endpoints `/admin/*` | Sin nueva infra |

**Costo adicional estimado: $0/mes** (Vercel free tier + misma EC2/RDS existente)

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| `superadmin` | Todo. Puede crear otros admins, ver revenue, cambiar precios, ban definitivo |
| `admin` | Todo excepto config de roles y datos financieros sensibles |
| `support` | Solo lectura en usuarios/grupos/reportes. Puede hacer ban temporal |

Los roles se implementan como **Cognito Custom Attributes** (`custom:admin_role`) y se validan en cada endpoint `/admin/*` del backend.

---

## Pre-requisitos completados

- [x] Sitio público hobbyer.club deployado en Vercel
- [x] DNS hobbyer.club + www.hobbyer.club configurados en NameSilo
- [x] 5 páginas con diseño Midnight Kinetic: /, /waitlist, /privacy, /terms, /beta
- [x] Página /partners con landing + formulario de registro de negocios
- [x] Tabla waitlist_subscribers creada en RDS PostgreSQL
- [x] Endpoint POST /api/v1/waitlist/ en FastAPI
- [x] Formulario waitlist conectado a backend (hobbyer-web → EC2 → RDS)
- [x] NEXT_PUBLIC_API_URL configurada en Vercel Production

---

## Sprint A — Fundación (Semanas 1–2)

### Objetivo: Panel funcional con auth y overview básico

### Backend (FastAPI)
- [x] **A.1** Middleware `require_admin_role` — valida JWT + claim `custom:admin_role`
- [x] **A.2** Endpoint `GET /admin/overview` — KPIs básicos: total users, MAU, DAU, total groups, total partners
- [x] **A.3** Script para asignar rol `superadmin` en Cognito vía CLI (bootstrap inicial)
- [x] **A.4** Endpoint `GET /admin/users` — listado paginado con filtros (nombre, email, fecha, estado)
- [x] **A.5** Endpoint `GET /admin/users/:id` — perfil detallado con actividad reciente

### Frontend (Next.js)
- [x] **A.6** Setup proyecto: `create-next-app`, Tailwind, shadcn/ui, TanStack Query, Zod
- [x] **A.7** Auth flow: login con Cognito Hosted UI → callback → sesión con `next-auth` o cookies
- [x] **A.8** Layout base: sidebar colapsible con navegación por módulos + topbar con usuario
- [x] **A.9** Route guard: middleware Next.js que redirige a login si no hay sesión válida
- [x] **A.10** `OverviewPage` — cards con KPIs del endpoint A.2 (usuarios totales, activos, nuevos hoy)
- [x] **A.11** `UsersPage` — tabla con paginación, búsqueda y filtros del endpoint A.4
- [x] **A.12** `UserDetailPage` — perfil completo del usuario del endpoint A.5

### DevOps
- [x] **A.13** Repositorio `hobbyer-web` en GitHub
- [x] **A.14** Deploy automático a Vercel en push a `main`
- [x] **A.15** Preview deployments en pull requests
- [x] **A.16** Variable de entorno `NEXT_PUBLIC_API_URL` apuntando al backend de EC2

---

## Sprint B — Usuarios y Moderación (Semanas 3–4)

### Objetivo: Control total sobre usuarios, reportes y moderación

### Backend (FastAPI)
- [x] **B.1** Endpoint `PATCH /admin/users/:id/status` — cambiar estado: `active / suspended / banned`
- [x] **B.2** Endpoint `GET /admin/reports` — cola de reportes pendientes con tipo, reportado, reportero
- [x] **B.3** Endpoint `PATCH /admin/reports/:id` — resolver reporte: `dismiss / warn / ban_temp / ban_permanent`
- [x] **B.4** Endpoint `GET /admin/users/:id/reports` — historial de reportes de un usuario
- [x] **B.5** Endpoint `GET /admin/users/:id/blocks` — historial de bloqueos
- [x] **B.6** Tabla `admin_actions` en PostgreSQL para audit log (quién hizo qué sobre quién, cuándo)
- [x] **B.7** Endpoint `GET /admin/audit-log` — historial de acciones de admins

### Frontend (Next.js)
- [x] **B.8** `ModerationPage` — cola de reportes con cards: foto del reportado, motivo, acciones rápidas
- [x] **B.9** Modal de acción rápida: Ignorar / Advertir / Ban temporal / Ban permanente + nota interna
- [x] **B.10** `UserDetailPage` — tab "Actividad": swipes, matches, grupos, reportes recibidos/enviados
- [x] **B.11** `UserDetailPage` — tab "Acciones admin": historial de bans, advertencias, notas
- [x] **B.12** `AuditLogPage` — tabla de acciones de admins con filtro por admin, tipo de acción, fecha
- [x] **B.13** Notificación toast de confirmación en cada acción crítica
- [x] **B.14** Rol-based rendering: el rol `support` ve las mismas páginas pero sin botones destructivos

---

## Sprint C — Groups & Discovery (Semana 5)

### Objetivo: Visibilidad completa sobre grupos y actividad de discovery

### Backend (FastAPI)
- [x] **C.1** Endpoint `GET /admin/groups` — listado paginado con hobby, creador, miembros, estado
- [x] **C.2** Endpoint `GET /admin/groups/:id` — detalle: miembros, actividad reciente, reportes
- [x] **C.3** Endpoint `PATCH /admin/groups/:id/status` — cambiar status: `OPEN / CLOSED / HIDDEN`
- [x] **C.4** Endpoint `GET /admin/swipes/stats` — totales likes/dislikes/superlikes por período
- [x] **C.5** Endpoint `GET /admin/matches/stats` — match rate, tiempo promedio hasta match

### Frontend (Next.js)
- [x] **C.6** `GroupsPage` — tabla con filtros por hobby, estado, cantidad de miembros
- [x] **C.7** `GroupDetailPage` — lista de miembros, mapa con ubicación, acciones de moderación
- [x] **C.8** `DiscoveryStatsPage` — gráficos de swipes diarios, match rate por hobby, funnel de conversión

---

## Sprint D ✅ — Partners & Membresías (Semanas 6–7)

### Objetivo: CRM básico para el modelo B2B de partners

### Base de datos (nuevas tablas)
- [x] **D.1** Migración run_migrations.py: tabla `partner_subscriptions` (partner_id, plan, price, status, started_at, expires_at)
- [x] **D.2** Migración run_migrations.py: tabla `partner_contacts` (partner_id, name, email, phone, role)

### Backend (FastAPI)
- [x] **D.3** Endpoint `GET /admin/partners` — listado con plan activo, fecha vencimiento, rating
- [x] **D.4** Endpoint `GET /admin/partners/:id` — detalle: datos del negocio, contactos, suscripción, historial de ofertas
- [x] **D.5** Endpoint `POST /admin/partners` — alta manual de partner (para el equipo de ventas)
- [x] **D.6** Endpoint `PATCH /admin/partners/:id` — editar datos, cambiar plan, suspender
- [x] **D.7** Endpoint `GET /admin/partners/:id/performance` — views, clicks, redenciones de oferta del partner
- [x] **D.8** Endpoint `GET /admin/subscriptions` — listado global de suscripciones (activas, por vencer, vencidas)

### Frontend (Next.js)
- [x] **D.9** `PartnersPage` — tabla con badge de plan, estado de suscripción, próximo vencimiento
- [x] **D.10** `PartnerDetailPage` — datos del negocio, contactos, tab de performance (views, clicks, redenciones)
- [x] **D.11** `PartnerDetailPage` — tab suscripción: plan activo, historial de pagos, renovar/suspender
- [x] **D.12** Modal "Nuevo partner" — formulario con validación Zod para alta manual
- [x] **D.13** `SubscriptionsPage` — lista global con alertas de próximos vencimientos (próximos 7 días resaltados)
- [ ] **D.14** Email automático de renovación (SES o SendGrid) — configurar desde este panel *(backlog)*

---

## Sprint E — Revenue & Usuarios Premium (Semana 8)

### Objetivo: Dashboard financiero completo

### Base de datos (nuevas tablas)
- [ ] **E.1** Migración Alembic: tabla `premium_subscriptions` (user_id, plan, price, status, started_at, expires_at, payment_provider, external_id)
- [ ] **E.2** Migración Alembic: tabla `payments` (subscription_id, amount, currency, status, provider_ref, created_at)

### Backend (FastAPI)
- [ ] **E.3** Webhook handler `POST /webhooks/mercadopago` (o Stripe) — recibe confirmación de pago y actualiza `payments` y `premium_subscriptions`
- [ ] **E.4** Endpoint `GET /admin/revenue/summary` — MRR, ARR, total cobrado en período, churn rate
- [ ] **E.5** Endpoint `GET /admin/revenue/breakdown` — desglose por fuente: premium usuarios vs partner subscriptions
- [ ] **E.6** Endpoint `GET /admin/revenue/transactions` — listado de pagos con filtros
- [ ] **E.7** Endpoint `GET /admin/users/premium` — usuarios premium activos, plan, próximo cobro
- [ ] **E.8** Endpoint `PATCH /admin/users/:id/premium` — otorgar/revocar premium manualmente (para casos edge)

### Frontend (Next.js)
- [ ] **E.9** `RevenuePage` — hero con MRR + ARR + cobros del mes, gráfico de tendencia mensual
- [ ] **E.10** `RevenuePage` — donut chart de desglose (premium users vs partner subscriptions)
- [ ] **E.11** `TransactionsPage` — tabla de todos los pagos con estado (completado/pendiente/fallido/reembolsado)
- [ ] **E.12** `PremiumUsersPage` — usuarios premium activos con próximo cobro y acción de cancelar/extender
- [ ] **E.13** Solo visible para rol `superadmin` (route guard por módulo)

---

## Sprint F — Analytics avanzado (Semanas 9–10)

### Objetivo: Inteligencia de negocio para decisiones de crecimiento

### Backend (FastAPI)
- [ ] **F.1** Endpoint `GET /admin/analytics/retention` — cohorts de retención (semana 1, 2, 4, 8)
- [x] **F.2** Endpoint `GET /admin/analytics/funnel` — registro → onboarding → primer swipe → primer match → premium
- [ ] **F.3** Endpoint `GET /admin/analytics/geo` — usuarios activos por ciudad/región (lat/lng agrupados)
- [x] **F.4** Endpoint `GET /admin/analytics/hobbies` — hobbies más populares, combinaciones frecuentes
- [ ] **F.5** Endpoint `GET /admin/analytics/engagement` — sesiones promedio por día, duración, páginas visitadas

### Frontend (Next.js)
- [ ] **F.6** `RetentionPage` — heatmap de cohorts (semanas en columnas, cohorte de ingreso en filas)
- [ ] **F.7** `FunnelPage` — funnel chart con % de conversión entre cada paso
- [ ] **F.8** `GeoPage` — mapa con clusters de usuarios activos (Google Maps o Mapbox)
- [ ] **F.9** `HobbiesPage` — barras horizontales de hobbies más populares + red de conexiones frecuentes
- [ ] **F.10** Selector de rango de fechas global que afecta todos los gráficos de analytics
- [ ] **F.11** Botón "Exportar CSV" en todas las tablas de analytics

---

## Sprint G — Notificaciones, Feature Flags & Config (Semana 11)

### Objetivo: Herramientas operativas para el equipo

### Backend (FastAPI)
- [ ] **G.1** Tabla `feature_flags` (key, value, description, updated_by, updated_at)
- [x] **G.2** Endpoint `GET/PUT /admin/feature-flags` — controlar features en producción sin deploy
- [ ] **G.3** Endpoint `POST /admin/notifications/broadcast` — enviar push notification a segmento de usuarios
- [x] **G.4** Endpoint `GET /admin/system/health` — estado de EC2, RDS, conexiones activas

### Frontend (Next.js)
- [x] **G.5** `FeatureFlagsPage` — lista de flags con toggle switch, descripción y último editor (`config/page.tsx`)
- [ ] **G.6** `BroadcastPage` — formulario para enviar push a: todos / usuarios premium / por hobby / por ciudad
- [ ] **G.7** `SystemHealthPage` — estado de servicios, latencia de DB, errores 5xx últimas 24hs (CloudWatch)
- [ ] **G.8** `RolesPage` — lista de admins con su rol, opción de cambiar rol o revocar acceso (solo superadmin)

---

## Sprint H — Polish & Hardening (Semana 12)

### Objetivo: Listo para uso diario del equipo

- [ ] **H.1** Dark mode (Tailwind + next-themes)
- [ ] **H.2** Responsive básico (tablets, no mobile — es un panel admin)
- [x] **H.3** Skeleton loaders en todas las tablas y gráficos (`TableSkeleton.tsx` + `ErrorState.tsx` implementados)
- [x] **H.4** Error boundaries con fallback UI amigable (`ErrorBoundary.tsx` implementado)
- [ ] **H.5** Rate limiting en endpoints `/admin/*` (100 req/min por admin)
- [x] **H.6** Audit log completo: toda acción POST/PATCH/DELETE de admin queda registrada (tabla `admin_actions`)
- [ ] **H.7** Session timeout: cookie con expiración de 8 horas, renovación automática
- [ ] **H.8** Tests de integración para los 10 endpoints críticos (pytest)
- [x] **H.9** `CHANGELOG.md` del dashboard para el equipo

---

## Roadmap visual de sprints

```
Semana:  1    2    3    4    5    6    7    8    9   10   11   12
Sprint A ████████
Sprint B           ████████
Sprint C                     ████
Sprint D                          ████████
Sprint E                                    ████
Sprint F                                         ████████
Sprint G                                                   ████
Sprint H                                                        ████
```

---

## Decisiones de arquitectura

### ¿Por qué Next.js y no React + Vite?

El App Router de Next.js permite RSC (React Server Components) que hacen fetch directo al backend sin pasar por el cliente. Para tablas de datos grandes, esto reduce significativamente el bundle size y el tiempo hasta primer render. Además, Vercel + Next.js es el stack con mejor DX y CI/CD sin configuración.

### ¿Por qué reutilizar el mismo Cognito User Pool?

Un partner o admin podría necesitar acceder tanto a la app como al panel. Con el mismo User Pool se maneja con un solo token, y los roles se implementan como Custom Attributes de Cognito que viajan en el JWT. Sin duplicar usuarios ni auth.

### ¿Por qué no usar un servicio de analytics externo (Mixpanel, Amplitude)?

Para el MVP el análisis se hace sobre los datos ya existentes en RDS y DynamoDB. Evita integrar un SDK en la app, elimina el costo mensual de herramientas externas y mantiene el control total de los datos. En Sprint 5 de la app principal se puede evaluar Amplitude si el volumen lo justifica.

### ¿Cuándo integrar MercadoPago vs Stripe?

**MercadoPago** es prioritario para Argentina, Chile, Colombia y México (mercado objetivo). Stripe como alternativa para otros mercados. Los webhooks son el punto de verdad: el estado de una suscripción se actualiza siempre desde el webhook, nunca desde el cliente.

---

## Notas de sesión

### Decisiones tomadas
- hobbyer.club en Vercel (free tier) — mismo repositorio que el futuro admin en subdominio admin.hobbyer.club
- Waitlist usa RDS PostgreSQL existente — tabla waitlist_subscribers con campos: id, email, name, hobby, source, status, created_at
- Diseño Midnight Kinetic (Plus Jakarta Sans + #101622 + #0d59f2) aplicado al sitio público — mismo sistema a usar en admin dashboard

### Pendiente revisar
- Reemplazar WHATSAPP_NUMBER placeholder en app/beta/page.tsx
- Configurar 3 GitHub Secrets para Firebase App Distribution: GOOGLE_SERVICES_JSON, FIREBASE_SERVICE_ACCOUNT, GOOGLE_MAPS_API_KEY
- Crear grupo "internal-testers" en Firebase Console
- Agregar emails reales de testers en build.gradle.kts

---

*Última actualización: 2026-03-30 — Sprint B completado: B.4 B.5 B.9 B.11 B.14.*
