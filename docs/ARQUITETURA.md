# Organização do jogo

O aplicativo usa Electron para a janela e serviços do computador, React para as telas migradas e Phaser para os mapas. HTML/CSS são ferramentas de apresentação; as decisões de jogo não devem depender de textos ou posições dos botões.

## Responsabilidades atuais

| Área | Código | Responsabilidade |
| --- | --- | --- |
| Aplicativo | `desktop/` | Janela, conta, sincronização e atualizações, com IPC isolado |
| Navegação | `game/navigation.js` | Contexto da jornada, comandos de navegação permitidos, reinicialização da loja e interação de jogo |
| Apresentação | `ui/src/` | Componentes React e adaptação visual da batalha |
| Regras locais | `game/game.js`, `game/expansion.js`, modelos específicos | Encontros, turnos, progressão, evoluções e inventário |
| Música | `game/audio.js` | Faixas e reprodução, usando o contexto da navegação |
| Mapas | `game/camp/`, `game/route-world.js` | Cenas e interações espaciais |
| Persistência | `game/mode-store.js`, `desktop/store.cjs` | Slots e armazenamento compatíveis |
| Verificação | `tests/`, `scripts/test-all.cjs` | Regras e fluxos reais da interface |

## Entrada no desafio

1. Jornada → apresentação: prepara somente a prévia do adversário. Não registra encontros, não aplica habilidades nem grava abandono de combate.
2. Apresentação → jornada: descarta a prévia. O save permanece retomável na jornada.
3. Apresentação → batalha: confirma o encontro, aplica efeitos de entrada e grava a batalha em andamento. O retorno livre deixa de existir.

As regras de desistência do Clássico e do Permadeath continuam diferentes. Os quatro slots existentes são preservados. Não há alteração de formato de save nesta entrega.

## Regras de interface

- Reabrir a loja começa na categoria inicial; renderizar uma compra não deve reiniciar sua navegação.
- Pokédex, Diário, sumário e PC abertos pela jornada compartilham o contexto de música da jornada.
- Loja, Centro e acampamento têm contextos separados.
- O menu de contexto padrão não aparece em superfícies do jogo; menus próprios do Social continuam recebendo o evento.
- Campos de texto preservam edição, seleção e copiar/colar.
- Mensagens ao jogador descrevem o que aconteceu, sem instruções sobre a tecnologia interna.

## Limites e continuidade

Esta entrega organiza as regras de navegação, mas não conclui uma reescrita do motor. Ainda existem globais (`R`, `S`, `B`, `ACT`), renderizadores legados e wrappers de funções. Migrar tudo de uma vez arriscaria saves e regras já existentes. Novas extrações devem substituir os wrappers da área correspondente e ser acompanhadas por testes de comportamento, evitando criar outro motor paralelo.

Os efeitos de habilidades e golpes pendentes continuam documentados em `TESTE-INTERFACE.md`. Catálogos completos não equivalem a mecânicas completas.

Antes de entregar: gerar o bundle local, executar os testes afetados, validar ambos os temas quando houver alteração visual e verificar o conteúdo e integridade do instalador. Nenhum teste Linux substitui uma instalação real no Windows.
