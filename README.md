# Paldo Bites KH — Admin Dashboard

Vue 3 + TypeScript + Pinia + Vue Router admin panel for Shawarma Best x Paldo Bites KH.

## Setup

```bash
npm install
npm run dev       # http://192.168.4.32:5173
npm run build
npm run type-check
```

## Pages

| Route       | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `/`         | Dashboard — KPI stats, revenue chart, order pipeline, recent orders            |
| `/orders`   | Orders — filter by status, expand to see items/remark/location, advance status |
| `/menu`     | Menu — toggle availability, edit name/price/desc per item                      |
| `/settings` | Settings — shop info, hours, order channels, min-order rules                   |

## Tech

- **Vue 3** + `<script setup lang="ts">`
- **TypeScript** — full types in `src/types/index.ts`
- **Pinia** — `useOrdersStore`, `useMenuStore`
- **Vue Router** — lazy-loaded views
- **Custom CSS** — brand colours, no UI library needed
