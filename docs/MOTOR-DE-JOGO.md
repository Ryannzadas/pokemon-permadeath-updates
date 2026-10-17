# Motor de jogo (Phaser)

O jogo está saindo de uma interface HTML/CSS ("site") para uma camada de jogo em Phaser. A migração é feita por fases, e cada tela passa a ser uma **cena**.

## Decisões

- **Escopo híbrido.** Tudo que é jogo roda em Phaser: batalha, jornada, menus, mochila, equipe e mapas. Login, Team Builder e administração de ligas continuam em HTML, como janelas com visual de jogo.
- **Resolução interna 480×270 (16:9)**, em pixel art, desenhada na resolução real da tela (câmera com zoom no tamanho em pixels do monitor), para textos nítidos. Por padrão o jogo preenche a janela; a opção "Pixels perfeitos" usa zoom inteiro nos pixels reais da tela (considerando a escala do Windows). F11 alterna a tela cheia (canal `window:fullscreen` do Electron).
- **As regras não são reescritas.** O motor de regras (`game.js`, `expansion.js` e modelos) continua sendo a autoridade. As cenas só apresentam o estado e enviam comandos.
- **Os saves não mudam.**

## Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `ui/engine/main.js` | Cria o jogo Phaser e decide qual cena desenha a tela atual (`SCENES`) |
| `ui/engine/stage.js` | Palco em tela cheia, zoom inteiro e bordas |
| `ui/engine/input.js` | Teclado e controle viram ações: `up`, `down`, `left`, `right`, `confirm`, `back` |
| `ui/engine/ui.js` | Texto pixelado, janelas, menu com cursor ▶ e rolagem, caixa de texto com digitação |
| `ui/engine/bridge.js` | Ligação com o motor de regras: aviso de mudança de estado, comandos e opções |
| `ui/engine/config.js` | Resolução, fonte e cores |
| `ui/engine/assets.js` | Carregamento de imagens, medição de pixels, sprite de espécie (FireRed ou comum), ícone de menu, personagem andando e respiração dos líderes |
| `ui/engine/scenes/battle-scene.js` | Batalhas da jornada (selvagem, treinador, treino, exploração, duplas) e online (Social e ligas), por fontes de batalha |
| `ui/engine/scenes/menu-scenes.js` | Título, modo, continuar, personagem, nome (campo HTML sobre o jogo) e inicial |
| `ui/engine/scenes/screen-base.js` | Base das telas de menu (reconstrução por estado, janelas, cabeçalho, mensagens) |
| `ui/engine/scenes/panel-scenes.js` | Janelas do jogo sobre o título ou a jornada: Opções e Coleção |
| `ui/engine/scenes/journey-scenes.js` | Menu da jornada, apresentação do treinador e resultados (vitória, derrota, campeão) |
| `ui/engine/scenes/collection-scenes.js` | Pokédex e Diário do Treinador |
| `ui/engine/scenes/party-scenes.js` | Equipe, Mochila, Loja e PC |
| `ui/engine/scenes/summary-scene.js` | Sumário do Pokémon em páginas (info, status, golpes, aprender, item, evolução) |
| `ui/engine/scenes/list-scenes.js` | Páginas simples em lista: missões, evento entre batalhas, desafios diários, memorial, jornadas clássicas, Liga concluída e pós-game em dupla |
| `ui/engine/scenes/world-scenes.js` | HUD dos mundos de caminhada (acampamento, Centro, caminho): local, mensagens, janelas de companheiro, enfermeira e descoberta, menu do X |
| `game/camp/scene.js` | Mundo de caminhada compartilhado (mapa, treinador, Pokémon, física). Com o motor ligado, roda como cena do jogo (`GameEngine.hostWorld`) com câmera seguindo o treinador |

O build (`npm run build:ui`) gera `game/engine.js`. O Phaser vem de `game/vendor` como global.

## Como uma cena conversa com as regras

1. **Estado.** O motor chama `render()` a cada mudança. A ponte avisa a cena, que relê `R`, `S` e `B`. Efeitos visuais também vêm do estado: `B.fx` indica quem levou o golpe e `B.visual` traz efeitos de golpe, status e atributos.
2. **Comandos.** As escolhas do jogador viram `GameCommands.dispatch(ação, valor)`, o mesmo caminho da interface antiga, com a proteção contra ação duplicada.
3. **Opções.** As listas que o motor já decide (itens usáveis, Pokémon para troca, alvos) são lidas dos controles que ele renderiza, só em `engineOptions()`. Mochila e Loja usam dados prontos do próprio motor: `BagView.data()` (itens, categorias e quais podem ser usados agora) e `ShopView.data()` (abas do modo, estoque, preço e quantidade máxima com o saldo). Na fase 6, o motor passa a entregá-las como dados e esse adaptador sai.

## Teclas

Setas ou WASD movem. Z, Enter ou Espaço confirmam. X, Esc ou Backspace voltam. No controle, A confirma, B volta e o direcional ou analógico move. Na batalha, 1 a 4 continuam usando os golpes direto.

## Testes

Os testes de interface antigos controlam o jogo clicando no HTML. Por isso o motor fica desligado quando o navegador é automatizado (`navigator.webdriver`), e esses testes continuam validando regras e fluxos. As cenas Phaser têm testes próprios, que ligam o motor com `window.FORCE_GAME_ENGINE = true` e jogam pelo teclado: `tests/engine-battle-ui.cjs`, `tests/engine-menu-ui.cjs`, `tests/engine-journey-ui.cjs`, `tests/engine-world-ui.cjs` e `tests/engine-online-ui.cjs`.

Janelas HTML abertas por cima (perfil, confirmações, evolução, Trainer Card) fazem o motor ceder a tela enquanto estiverem abertas.

## Fases

0. Fundação: palco, entrada, janelas, ponte. ✅
1. Batalhas da jornada. ✅
2. Título, menus e jornada. ✅ (telas internas como loja, equipe e Pokédex ainda abrem em HTML até a fase 3)
3. Equipe, sumário, mochila, loja, PC, Pokédex, Diário, missões, eventos, desafios diários, memorial e jornadas clássicas. ✅
4. Acampamento, Centro e rotas no mesmo jogo. ✅ (o mundo é uma cena do jogo; Z fala/observa, X abre o menu)
5. Batalhas online (Social e liga). ✅ A cena de batalha tem duas fontes: a jornada (R/S/B) e o cliente online (`OnlineBattle.state()` em `game/social-ui.js`). A versão HTML no estilo FireRed (`ui/src/battle-firered.js`) só aparece com o motor desligado.
6. Limpeza. ✅ Feito: notas soltas da raiz foram para `docs/` (`versoes/`, `testes/`, `revisao/`); scripts de teste organizados (`test:engine`, `test:online`, `test:full`) e testes órfãos de layouts substituídos removidos; `verify:package` vale para as versões de teste no Windows; imagens sem uso removidas; Mochila, Loja e batalha online já entregam dados ao motor (`BagView`, `ShopView`, `OnlineBattle`).
   Continua de propósito: o HTML antigo das telas é a versão usada com o motor desligado (testes automatizados e computadores sem Phaser), e a batalha da jornada e as páginas em lista ainda leem as opções dos botões que o motor de regras desenha (`engineOptions` e `readPage`). Trocar esses leitores por dados é o próximo passo, tela por tela, junto com a redução das folhas de CSS sobrepostas.
