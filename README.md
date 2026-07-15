# Mis Reales 🐱💰

Tu gato financiero personal. Una PWA para controlar gastos, presupuestos por quincena, metas de ahorro y deudas — sin aburrirte.

## Características

- **Gastos e ingresos** con categorías y notas, en Balboas (B/.)
- **Presupuestos por quincena** (1–15 y 16–fin de mes), con medidores por categoría
- **Metas de ahorro** con abonos y confeti al cumplirlas 🎉
- **Control de deudas** con seguimiento de pagos
- **Gamificación**: rachas diarias, 12 logros, niveles con XP (de "Gatito Novato" a "Rey de los Reales")
- **Gato mascota** que reacciona a tus finanzas: feliz, preocupado o juzgándote 😾
- **Privado**: todos los datos viven en tu teléfono (localStorage). Respaldo exportable/restaurable desde la pestaña Logros.
- **PWA**: instalable en iPhone (Safari → Compartir → "Añadir a pantalla de inicio"), funciona sin conexión.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción en dist/
```

Stack: Vite + React + TypeScript. Sin backend ni dependencias de gráficas — todo SVG/CSS hecho a mano.
