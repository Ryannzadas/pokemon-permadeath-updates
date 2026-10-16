# Pokémon Permadeath — teste das telas aprovadas

Versão **0.4.1-test.12**.

## Novidades da test.12

- O jogo preenche a janela por padrão (sem bordas largas); F11 ou Opções → Tela cheia deixa sem borda nenhuma e é lembrado.
- Zoom correto com escala do Windows (125%, 150%).
- Opções e Coleção viraram janelas do jogo, abertas pelo título e pela jornada (item OPÇÕES).

## test.11

## Novidades da test.11

- Título, escolha de modo, continuar, personagem, nome e inicial agora rodam no motor de jogo Phaser.
- Menu da jornada, apresentação dos líderes e telas de resultado (vitória, recompensas, derrota, campeão) também.
- Tudo navegável com teclado/controle; o mouse continua funcionando.
- Loja, equipe, mochila, Pokédex, Diário, PC, acampamento, Centro, rotas, Social e Team Builder ainda abrem na interface anterior (fase 3 em diante).

## test.10

## Novidades da test.10

- Pokémon acima do #386 (sem sprite do FireRed) aparecem em tamanho proporcional na batalha.
- Fugir no Clássico não custa mais dinheiro (Permadeath continua cobrando).
- Selvagens mais variados: rotas com mais tipos (Floresta: Planta/Inseto/Normal/Voador; Caverna: Pedra/Terra/Lutador/Aço; Lago: Água/Gelo/Elétrico) e iniciais regionais com 1/3 da chance.

## test.9

## Novidades da test.9

- As batalhas da jornada (selvagem, treinador, ginásio, treino, exploração e duplas) agora rodam no motor de jogo Phaser, em tela cheia 16:9 com pixel art em escala inteira. A interface de site some durante a batalha.
- Teclado e controle: setas/WASD movem, Z/Enter confirmam, X/Esc voltam; no controle, A confirma e B volta.
- Mochila e troca de Pokémon na batalha com cartões, sprites, barras de HP e ícones.
- Batalhas online continuam na versão estilo FireRed em HTML até a fase 5 (veja docs/MOTOR-DE-JOGO.md).

## test.8

## Novidades da test.8

- Batalhas no estilo FireRed em todos os formatos (jornada, treino, duplas, Social e liga): menu LUTAR/MOCHILA/POKÉMON/FUGIR, caixa de texto com as ações e fonte pixelada Jersey 10 (licença OFL).
- Golpes com a cor do tipo e indicação Super efetivo / Efetivo / Pouco efetivo nas batalhas simples da jornada.
- Sprites originais de FireRed/LeafGreen (PokéAPI, offline) para as espécies #1-386; as demais mantêm o sprite atual.
- Teclado na batalha: setas, Z confirma, X/Esc volta; 1-4 continua usando golpes direto.
- Mochila redesenhada com abas e cartões; relíquias do Permadeath voltam a aparecer.
- Loja abre em Pokébolas no Clássico; "Outros" passa a ser a última aba.
- Correções: sprites cobrindo nomes na apresentação dos líderes, busca invisível no Team Builder, Voltar duplicado, dinheiro sem formatação e nomes como Mr. Mime e Nidoran♀/♂.

## Instalar

Feche a edição de teste anterior. Extraia o ZIP e execute **Pokemon-Permadeath-Teste-React-Setup.exe**. Abra o atalho **Pokemon Permadeath - Teste Visual**.

Abre maximizado e usa a mesma pasta de dados da edição visual de teste anterior. O jogo normal tem outra pasta. Esta entrega não publica release e não instala atualização no jogo normal.

A edição usa o Firebase e o Render já configurados. Para experimentar sem alterar sua conta principal, use o modo convidado ou uma conta de teste. Login e sincronização são reais nesta edição, diferentemente do protótipo HTML.

## O que mudou

- Menu, jornada, personagens, equipe, loja, Pokédex, PC, Diário, exploração, Centro, acampamento, perfil, acesso, Social, ligas e Team Builder adaptados à direção visual aprovada.
- Barra lateral verde, cabeçalho fixo, cartões claros, ícones consistentes, espaço e contraste nos dois temas.
- Sumário com abas de Golpes, Status, Aprendizado e Evolução. Habilidades e itens ficam em Status, com acesso pelo cartão do item.
- Reaprendizado preserva PP; TM/HM e equipáveis usam o inventário real.
- PC separado em Caixa da jornada e Equipes campeãs.
- Líderes, Elite Four e campeões mostram os Pokémon e níveis da equipe real antes de começar.
- Arena em cima, golpes abaixo e registro ao lado; menus longos rolam dentro do painel. Golpes com a cor do tipo em batalhas individuais, duplas e online.
- Posições de sprites e HP ajustadas nas duplas.
- Confirmações de abandonar jornada e excluir liga dentro do visual do jogo.
- Um único controle de comandos evita disparos repetidos enquanto uma ação está pendente.

## Conferir jogando

1. Comece uma jornada, escolha modo/personagem/nome/inicial e confira os quatro espaços de save.
2. Abra cada seção pela lateral; use Voltar e confira o dinheiro no cabeçalho.
3. No Sumário, teste um item equipado, reaprenda um golpe e ensine uma TM/HM compatível da mochila.
4. Antes de um ginásio, abra a apresentação, veja a equipe e volte. Comece quando quiser.
5. Na batalha, confira Mochila, captura quando permitida, troca e substituição obrigatória.
6. No Clássico, visite o Centro. No Permadeath, confira treino e recuperação conforme as regras existentes.
7. Em Social, convide um amigo, edite uma liga e teste uma batalha em dupla.
8. Salve um time no Team Builder e confira golpes, item, habilidade e natureza.
9. Abra o perfil, sincronize, altere nome/avatar e confira se o campo e a rolagem permanecem no lugar.
10. Teste os temas claro/escuro e diferentes tamanhos de janela.

## Validação automatizada

Modelos locais de batalha, save, conta e updater; fluxo real de nova jornada; contraste e espaço nos dois temas; apresentações dos 14 treinadores; navegação e áudio; criação/edição/exclusão de liga com servidor em memória; batalha online de dois clientes; quatro saves e pós-game; abas e ações reais do Sumário; recuperação do boot após falha de carregamento. O instalador passa por verificação de integridade NSIS e o conteúdo empacotado é comparado com o fonte testado.

A autenticação Google real, o serviço Render de produção e a execução do instalador no Windows precisam ser conferidos no seu computador. Os testes de Social usam servidor local em memória.

## Sem alteração de regras

A adaptação preserva progresso, dificuldade, itens, habilidades e golpes existentes. Efeitos ainda pendentes no catálogo continuam marcados. Alguns nomes continuam em inglês quando falta tradução no catálogo atual. As imagens de referência podem variar em quantidade de Pokémon e conteúdo, pois aqui aparecem os dados reais da jornada.

## Fonte

O ZIP de fonte contém `game`, `desktop`, `ui`, testes e scripts. Para desenvolvimento: `npm ci`, `npm run build:ui`, `npm start`. Consulte `docs/INTERFACE-APROVADA.md` para a organização.
