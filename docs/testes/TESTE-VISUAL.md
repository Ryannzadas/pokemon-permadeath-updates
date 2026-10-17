# Pokémon Permadeath — Interface e quatro jornadas

Build de teste: **0.4.1-test.2**, sobre o jogo e o sistema de batalha existentes.

## Instalar

Feche a edição de teste visual, extraia o ZIP do instalador e execute `Pokemon-Permadeath-Teste-Visual-Interface-Setup-r2.exe`. Abra o atalho **Pokemon Permadeath - Teste Visual**.

A edição abre maximizada e mantém a mesma pasta de dados da edição de teste visual anterior. O aplicativo normal tem outra pasta. Esta entrega não publica release nem atualiza automaticamente o aplicativo normal.

O teste usa o mesmo Firebase e servidor Render existentes. Para experimentar sem alterar o progresso da conta principal, use uma conta de teste ou jogue como convidado. Depois de criar quatro slots, continue usando esta build para essa conta: versões anteriores só reconhecem o formato de dois slots.

## Alterações

- Texto legível, contraste corrigido, controles com tamanhos consistentes e menos espaço ocupado pelos botões.
- Navegação, abas com categoria ativa, teclado por setas, retorno fixo e saldo dentro da barra superior.
- Transições curtas nas mudanças de tela e abertura/fechamento do perfil. Atualizações de texto não repetem a animação. A preferência de reduzir movimento é respeitada.
- Feedback nos botões; avisos de atualização e de progresso com estilo consistente. O ícone de salvamento aparece e some ao lado do perfil.
- Idioma dos golpes corrigido nas configurações; opções permanecem abertas.
- Títulos legíveis no acampamento e Centro Pokémon, categorias da loja sem grupos duplicados e abas que acompanham a largura da janela.
- Mensagem e botão centralizados nas apresentações dos 8 líderes, 4 membros da Elite Four e 2 campeões.
- Jornadas clássicas salvas também abrem pela coleção da jornada.
- **Quatro slots independentes**: Clássico/Padrão, Clássico/Duplas, Permadeath/Padrão e Permadeath/Duplas. A tela Continuar identifica cada um. Criar um pós-game em duplas preserva o padrão do mesmo modo.
- Migração dos saves anteriores: uma jornada em duplas já existente passa para seu slot em duplas; nenhuma jornada antiga é convertida em outro modo.
- Correções de batalha: recuperação e recuo usam o HP realmente removido; Struggle aplica recuo uma vez; Splash não concede proteção defensiva.

A camada visual foi adaptada ao código atual. As referências Skiper UI, SmoothUI, Unlumen, SkeuDesign, Dribbble, Spell e Coolors orientam organização e movimentos. Nesta etapa não há migração completa para React.

## Verificação

Testes locais cobrem os modelos de dados, saves, migração, PP, evolução/Sylveon, tipos, troca obrigatória, treino, compras por quantidade e rollback, PC, pós-game, relógio, perfil, conta simulada, sincronização simulada e atualizador simulado. A revisão visual percorreu menu, jornada, loja, mochila, sumário, PC, Pokédex, diário, conquistas, desafios, memorial, jornadas salvas, Team Builder, acampamento, Centro Pokémon e Social.

As 14 apresentações de treinadores foram verificadas em 1280, 720 e 390 pixels. O multiplayer foi testado com dois clientes e servidor local: amizade, convites, batalha individual/dupla, troca após desmaio, itens, retorno e ligas. Isso não substitui o teste do servidor Render/Firebase reais. A instalação e execução no Windows também precisam do teste no seu computador.

## Habilidades e golpes: limite confirmado

O catálogo online contém 1.025 espécies, 919 golpes nesta junção de dados e 284 habilidades. **O motor implementa 17 dessas habilidades; 267 continuam pendentes.** A varredura de metadados apontou 322 golpes com efeitos adaptados ou que exigem revisão específica. Os outros golpes também não foram certificados como equivalentes em todos os detalhes aos jogos oficiais.

`REVISAO-EFEITOS.csv` e `REVISAO-EFEITOS.json`, no código-fonte, registram a auditoria. Dados completos no Team Builder não significam efeitos completos na batalha. A implementação integral dos efeitos é uma etapa de desenvolvimento do motor, separada desta revisão.

## Servidor para testar as correções de combate online

O ZIP de servidor contém o runtime com as três correções de combate. Para que valham no multiplayer real, substitua os arquivos do servidor Render pelos arquivos dessa pasta, preservando seu Secret File e configurações atuais, e faça o deploy. Não há chave privada incluída no pacote. Sem atualizar o servidor, as mudanças de interface e os quatro saves funcionam no aplicativo, mas o combate online usa a versão anterior do servidor.

## Desenvolvimento

```sh
npm ci
npx playwright install chromium
npm test
npm run test:ui
npm run test:interface
npm run audit:effects
```

Os componentes da nova camada ficam em `game/interface.js` e `game/interface.css`. O teste com ROM foi descartado e não está incluído.

## Instalador corrigido — r2

Recompilado em arquivo exclusivo após detectar uma colisão entre compilações do pacote anterior. O tamanho declarado pelo NSIS e o CRC de inicialização foram validados. O ZIP também teve sua integridade conferida e o EXE extraído dele foi comparado ao original validado. A integridade do NSIS permanece ativada. Não há mudança nos saves nem nas regras do jogo.
