# Interface aprovada no FigCraft

A edição 0.4.1-test.7 adapta os layouts aprovados aos dados e comandos do jogo. Os 75 quadros de design descrevem telas e estados; não são páginas estáticas incluídas no aplicativo.

## Organização

| Área do desenho | Implementação |
| --- | --- |
| Menu, modos, saves, personagem, jornada, equipe e preferências | Componentes React em `ui/src/main.jsx` |
| Sumário: golpes, atributos, aprendizado e evolução | `ui/src/pokemon-summary.jsx`, usando modelos e ações existentes |
| PC, Pokédex, loja, resultados, exploração, Social, ligas e Team Builder | Renderizadores do jogo com composição em `ui/src/presentation.js` |
| Arena e comandos de batalha | `ui/src/battle-layout.js`, executor de batalha existente |
| Perfil, sincronização e atualizações | `game/account.js` e estilo compartilhado |
| Acesso por Google/e-mail e recuperação | `desktop/auth-page.html`, fluxo de autenticação existente |
| Confirmações de jornada e liga | `ui/src/dialogs.js` e ações correspondentes |
| Paleta, layout, contraste, temas e adaptação à janela | `game/approved-ui.css`, aplicado depois da base React |

O jogo continua responsável por regras, dados, inventário, progresso e autorização no multiplayer. A apresentação não inventa equipes, preços, saldo nem resultados. Os sprites vêm dos assets existentes do projeto.

## Regras de apresentação

- Preenchimento dos botões de golpe usa a cor do tipo. A cor do texto é calculada para manter contraste, nos dois temas.
- Cabeçalho e navegação permanecem visíveis. Social pertence ao menu principal.
- Campos editáveis conservam seleção e posição do cursor. Abas do sumário não alteram HP, PP, experiência ou amizade.
- Aprendizado mostra apenas TM/HM disponíveis e compatíveis. Equipar e remover usam o inventário real.
- A introdução do treinador lista a equipe gerada que participará do combate.
- Os mundos do acampamento e Centro preservam os canvases Phaser. O novo visual não substitui caminhada por uma imagem.
- Confirmações de abandono/exclusão são canceláveis, dão foco à opção segura e bloqueiam ações da tela ao fundo.
- Comandos de interface passam por `game/commands.js`, que aguarda ações assíncronas, evita envio repetido da mesma ação pendente e exibe falhas sem perder o estado.
- O layout se adapta à janela. Listas longas têm rolagem; não se reduz o texto com opacidade.

## Limites desta entrega

A edição de teste mantém a implementação existente dos golpes, habilidades e itens. Os efeitos ainda marcados como pendentes no Team Builder continuam identificados; esta adaptação visual não declara suporte novo a esses efeitos. A tradução dos nomes mantém o catálogo atual, que ainda tem nomes em inglês quando falta tradução.

As regras dos modos, as quatro posições de save e os dados Firebase/Render permanecem no modelo existente. Não há migração de esquema nesta entrega. Campos, confirmadores e dados de exemplo da prévia HTML não são usados no jogo.

## Validação

Ver `TESTE-INTERFACE.md` para os cenários testados e como instalar. Execute `npm run build:ui` antes de testar ou empacotar. `game/react-ui.js` é gerado localmente pelo esbuild; não depende de CDN nem de conexão para abrir os menus.
