import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Arquitectura',
      items: [
        'arquitectura/index',
        'arquitectura/monorepo',
        'arquitectura/configuracion',
        'arquitectura/contenedores',
        'arquitectura/componentes',
        'arquitectura/secuencia',
        'arquitectura/casos-de-uso',
        'arquitectura/decisiones',
        'arquitectura/contratos-captura',
        'arquitectura/contratos-analisis',
        'arquitectura/mocks-captura',
        'arquitectura/adaptadores-captura-real',
        'arquitectura/persistencia-sesion',
      ],
    },
    {
      type: 'category',
      label: 'Diseño',
      items: [
        'diseno/sistema-de-diseno',
      ],
    },
  ],
};

export default sidebars;
