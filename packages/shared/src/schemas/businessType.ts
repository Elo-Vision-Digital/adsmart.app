import * as z from 'zod'

// Tipos de negócio que o usuário seleciona no Passo 3 do fluxo de geração
// de relatório (FLOW-3 ). Substitui o conceito de "template" da
// versão anterior — agora a IA usa este enum para decidir quais métricas
// são relevantes e como estruturar a análise textual do relatório.
//
// Lista é EXTENSÍVEL — quando um novo tipo for adicionado, atualize aqui +
// callers (analyzeReportData, FLOW-3 UI, schema de structure por tipo).
// Decisão do usuário 2026-05-19 — sem subscription nem créditos variáveis
// : 1 crédito por plataforma selecionada,
// independentemente do tipo escolhido.

export const BusinessTypeSchema = z.enum([
  'launch',                  // Lançamento — campanhas de período curto com pico
  'local',                   // Negócio Local — geo-targeting + presença física
  'evergreen',               // Perpétuo — venda direta de produto/serviço contínuo
  'ecommerce',               // E-commerce — funil de loja online
  'content_distribution',    // Distribuição de Conteúdo — alcance/views/engajamento de conteúdo
  'remarketing',             // Remarketing — re-engajamento de audiência existente
  'branding',                // Branding — awareness/posicionamento de marca
])
export type BusinessType = z.infer<typeof BusinessTypeSchema>
