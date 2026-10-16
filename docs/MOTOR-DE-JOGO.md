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
| `ui/engine/scenes/battle-scene.js` | Batalhas da jornada: selvagem, treinador, treino, exploração e duplas |
| `ui/engine/scenes/menu-scenes.js` | Título, modo, continuar, personagem, nome (campo HTML sobre o jogo) e inicial |
| `ui/engine/scenes/screen-base.js` | Base das telas de menu (reconstrução por estado, janelas, cabeçalho, mensagens) |
| `ui/engine/scenes/panel-scenes.js` | Janelas do jogo sobre o título ou a jornada: Opções e Coleção |
| `ui/engine/scenes/journey-scenes.js` | Menu da jornada, apresentação do treinador e resultados (vitória, derrota, campeão) |

O build (`npm run build:ui`) gera `game/engine.js`. O Phaser vem de `game/vendor` como global.

## Como uma cena conversa com as regras

1. **Estado.** O motor chama `render()` a cada mudança. A ponte avisa a cena, que relê `R`, `S` e `B`. Efeitos visuais também vêm do estado: `B.fx` indica quem levou o golpe e `B.visual` traz efeitos de golpe, status e atributos.
2. **Comandos.** As escolhas do jogador viram `GameCommands.dispatch(ação, valor)`, o mesmo caminho da interface antiga, com a proteção contra ação duplicada.
3. **Opções.** As listas que o motor já decide (itens usáveis, Pokémon para troca, alvos) são lidas dos controles que ele renderiza, só em `engineOptions()`. Na fase 6, o motor passa a entregá-las como dados e esse adaptador sai.

## Teclas

Setas ou WASD movem. Z, Enter ou Espaço confirmam. X, Esc ou Backspace voltam. No controle, A confirma, B volta e o direcional ou analógico move. Na batalha, 1 a 4 continuam usando os golpes direto.

## Testes

Os testes de interface antigos controlam o jogo clicando no HTML. Por isso o motor fica desligado quando o navegador é automatizado (`navigator.webdriver`), e esses testes continuam validando regras e fluxos. As cenas Phaser têm testes próprios, que ligam o motor com `window.FORCE_GAME_ENGINE = true` e jogam pelo teclado: `tests/engine-battle-ui.cjs`, `tests/engine-menu-ui.cjs` e `tests/engine-journey-ui.cjs`.

Janelas HTML abertas por cima (perfil, confirmações, evolução, Trainer Card) fazem o motor ceder a tela enquanto estiverem abertas.

## Fases

0. Fundação: palco, entrada, janelas, ponte. ✅
1. Batalhas da jornada. ✅
2. Título, menus e jornada. ✅ (telas internas como loja, equipe e Pokédex ainda abrem em HTML até a fase 3)
3. Equipe, sumário, mochila, loja, PC e Pokédex.
4. Acampamento, Centro e rotas no mesmo jogo.
5. Batalhas online (Social e liga). Até lá, elas usam a versão HTML no estilo FireRed (`ui/src/battle-firered.js`).
6. Limpeza: o motor passa a expor opções como dados, e saem as camadas antigas de HTML e CSS.
