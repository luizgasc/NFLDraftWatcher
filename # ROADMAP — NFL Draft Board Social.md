# ROADMAP — NFL Draft Board Social

## Visão do produto

Construir uma plataforma web focada em draft da NFL com 4 pilares:

1. **Prospect Hub**
   - Catálogo de prospectos
   - Página individual por jogador
   - Rankings e filtros

2. **User Draft Boards**
   - Usuários montam sua ordem de picks
   - Salvam múltiplas versões
   - Publicam e compartilham boards
   - Comparam com consenso da comunidade

3. **Community Chat**
   - Chat global
   - Chat por time
   - Chat por evento/rodada no dia do draft

4. **NFL News Feed**
   - Notícias relevantes
   - Associação por prospecto, time e tema
   - Atualização automática

---

## Objetivo do MVP

Entregar uma primeira versão funcional com:

- autenticação
- pipeline de ingestão de prospectos com dados normalizados
- catálogo de prospectos
- página de prospecto
- comparação entre dois prospectos
- ranking geral
- board individual do usuário com drag-and-drop
- autosave do board
- publicação de board por link
- feed de notícias
- chat global simples

---

## Fora do escopo do MVP

Não implementar agora:

- mock draft multiplayer em tempo real
- sistema de pontuação pós-draft
- leaderboard competitivo
- moderação avançada com painel completo
- chat por pick em tempo real
- push notifications
- app mobile nativo

---

## Stack alvo

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- dnd-kit

### Backend / Plataforma
- Supabase
- Postgres
- Supabase Realtime
- Storage para imagens e assets
- Redis/Upstash para cache e rate limit

### Integrações
- Provider de prospectos/draft via adapter
- Provider de notícias via adapter

### Deploy
- Vercel para frontend
- Supabase para backend/database

---

## Princípios de arquitetura

1. Nunca acoplar o frontend diretamente ao provider externo.
2. Criar camada de `adapters/providers`.
3. Modelar dados internos com schema próprio.
4. Separar claramente:
   - domínio
   - UI
   - integração externa
   - realtime/chat
5. Toda feature deve nascer com:
   - validação
   - loading state
   - empty state
   - tratamento de erro
6. Crawlers e integrações devem persistir dados em modelos internos normalizados antes de qualquer consumo pela UI.
7. Estatísticas normalizadas devem preservar provenance/source attribution para resync, auditoria e reconciliação futura.
8. Views comparativas devem consumir apenas entidades internas e view models próprios, nunca payloads crus de providers.

---

## Milestones de entrega

### Regra operacional

Executar exatamente um milestone por vez.

O milestone ativo deve sempre ser o primeiro milestone incompleto.

Se o repositório ainda não possuir scaffold funcional de aplicação, o milestone ativo é `M0 — Foundation`.

### M0 — Foundation

Objetivo:
- estabelecer a base técnica e visual do projeto

Inclui:
- scaffold do projeto Next.js com TypeScript
- setup de Tailwind CSS
- setup de `shadcn/ui`
- layout base da aplicação
- primitives/shared components iniciais
- validação de variáveis de ambiente
- import aliases
- baseline de lint/format se estiver ausente
- scaffolding de client/server para Supabase
- estrutura inicial de pastas alinhada ao domínio e ao roadmap

Componentes fundacionais esperados:
- `PageContainer`
- `SectionHeader`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`

Restrições:
- não implementar Prospect Hub funcional
- não implementar Draft Boards
- não implementar News Feed
- não implementar Chat
- não implementar drag-and-drop
- não acoplar UI a providers externos
- preferir server components, usando client components apenas quando necessário

Saída esperada:
- projeto inicial executando localmente
- base visual consistente com o `STYLE_GUIDE.md`
- fundações prontas para ingestão de dados e features futuras

### M1 — Prospect data ingestion + normalized domain

Objetivo:
- criar a base de dados de prospectos a partir de fontes externas sem expor formato externo para o restante do sistema

Inclui:
- entrypoints de crawler/jobs para coleta de prospectos
- definição de limites de scheduling/orquestração
- adapters para providers de prospectos
- schema interno normalizado para prospectos
- schema interno normalizado para measurements, combine, production, ranking e metadata
- regras de transformação raw-to-normalized
- persistência no Postgres/Supabase com campos de provenance/origem
- tratamento de falhas, retries e observabilidade básica do pipeline

Não inclui:
- UI final do catálogo
- comparação visual de prospectos
- boards do usuário

### M2 — Auth + Prospect Hub base

Objetivo:
- entregar autenticação e primeira camada funcional do Prospect Hub usando apenas dados internos normalizados

Inclui:
- autenticação
- autorização inicial com implicações futuras para RLS
- catálogo de prospectos
- página individual de prospecto
- ranking geral
- filtros e busca essenciais
- estados de loading, empty e error em todas as superfícies relevantes

Não inclui:
- comparação entre prospectos
- board do usuário
- chat
- feed de notícias

### M3 — Prospect compare experience

Objetivo:
- permitir comparação direta entre dois prospectos com leitura rápida e consistente

Inclui:
- comparable view entre exatamente dois prospectos
- grupos de stats compartilhados baseados no schema normalizado
- view models internos para comparação
- loading, empty e error states da experiência comparativa
- composição server-first com client components somente onde houver interatividade obrigatória

Restrições:
- não depender de campos específicos de provider
- não expandir para scouting suite ampla nesta fase
- não integrar comparação com boards ou chat nesta fase

### M4 — User Draft Boards

Objetivo:
- permitir que usuários criem, ordenem, salvem e publiquem boards próprios

Inclui:
- criação de board
- múltiplas versões
- drag-and-drop com `dnd-kit`
- autosave
- publicação por link
- base de permissão para propriedade do board

### M5 — NFL News Feed

Objetivo:
- entregar feed de notícias relevante e conectado ao domínio interno da aplicação

Inclui:
- adapter de provider de notícias
- ingestão e normalização de notícias
- feed de notícias
- associação por prospecto, time e tema

### M6 — Community Chat

Objetivo:
- entregar primeira experiência de conversa em comunidade com base segura e extensível

Inclui:
- chat global simples
- foundation para salas por time
- foundation para realtime com Supabase Realtime
- consideração de auth, moderação básica e autorização futura

---

## Estrutura inicial do monorepo

```txt
apps/
  web/
    src/
      app/
      components/
      features/
      lib/
      services/
      hooks/
      types/
      styles/

packages/
  domain/
  ui/
  config/
  providers/
    draft-provider/
    news-provider/

supabase/
  migrations/
  seeds/

docs/
  ROADMAP.md
  PRD.md
  ARCHITECTURE.md