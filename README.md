# Correções da 0.4.0

Cursor preservado nos formulários; envio de alterações feitas durante a sincronização; Team Builder com as 288 espécies disponíveis, separado da Pokédex das jornadas; Coleção/Social independentes; acesso sempre visível às jornadas clássicas atuais e concluídas. Atualize `server/social-service.cjs` no Render para liberar times sem capturas.

# Multiplayer gratuito no Render — edição 0.4.0

Servidor adaptado ao Render Free, com autenticação e persistência no Firebase Spark. Veja `docs/ATIVAR-MULTIPLAYER.md`. O aplicativo tem o campo Amigos e ligas → Conexão multiplayer para salvar o endereço HTTPS do Render. As credenciais Admin ficam exclusivamente no Secret File do servidor.

Os modelos e o adaptador HTTP foram testados localmente; a publicação real depende da sua configuração no Render. Esta edição substitui a instrução de ativação via Cloud Functions da entrega anterior.

# Desenvolvimento 0.4.0

Esta é uma versão de teste, sem publicação automática. Execute `npm ci` e `npm start` para abrir o aplicativo; `npm test` valida os modelos e o servidor. Os testes de interface usam Playwright e `BROWSER_PATH` quando necessário.

- Alterações: [docs/versoes/RELEASE-NOTES-0.5.0.md](docs/versoes/RELEASE-NOTES-0.5.0.md).
- Ativação do serviço online: [docs/ATIVAR-MULTIPLAYER.md](docs/ATIVAR-MULTIPLAYER.md).
- O backend em `server` usa o mesmo motor de batalha da build, preparado por `scripts/prepare-server.cjs`. Credenciais de administração não fazem parte do aplicativo.
- `npm run dist:win` gera o instalador e os metadados, com publicação desativada.

# Pokémon Permadeath 0.3.4

## Novidades da 0.3.4

- Limite de nível por etapa nos dois modos, incluindo duplas. XP e Doce Raro respeitam o limite; o excesso de XP não fica acumulado. Pokémon de saves anteriores que já passaram do limite preservam o nível e aguardam a próxima etapa para ganhar XP.
- Compra por quantidade em todos os itens de estoque repetido: suprimentos, pedras e outros itens de evolução, equipáveis e TM/HM. O campo mostra o total e aceita de 1 a 999 unidades, limitado pelo saldo. Relíquias mantêm compra única. Falha ao salvar devolve dinheiro, estoque e mochila.
- Tipagem atual do catálogo, incluindo Água/Fada para Marill/Azumarill e Normal/Fada para Azurill. Pokémon da equipe e PC em saves antigos são corrigidos ao continuar; golpes Fada usam o tipo correto.
- Sprites das oito insígnias de Kanto no painel da jornada e Trainer Card. As não conquistadas ficam apagadas.
- Resultado de batalha com níveis alcançados e novos golpes aprendidos pela equipe viva, inclusive reserva. Avisos temporários aparecem em sequência e podem ser fechados; incluem treino do Permadeath. Novos golpes ficam disponíveis no sumário. Avisos também informam quando uma evolução fica disponível e quando é concluída, sem repetir a disponibilidade em toda batalha.
- Proteção na tela de combate: ao aguardar uma ação com o ativo desmaiado e reserva viva, reabre a escolha obrigatória. Encontros extras antes dos ginásios foram testados nos dois modos, após golpe, veneno, falha de fuga e de captura.

Limites: Brock 10, Misty 15, Lt. Surge 20, Erika 26, Janine 31, Sabrina 36, Blaine 41, Giovanni 47, Will 52, Koga 57, Bruno 62, Karen 68, Lance 73 e Blue 78. O limite aumenta ao vencer cada desafio; após a Liga, chega a 100. Novas duplas começam novamente no primeiro limite.

Insígnias: sprites originais de Pokémon HeartGold/SoulSilver, obtidos do Bulbagarden Archives. Links de origem em `game/assets/badges/sources.json`. Os direitos dos sprites pertencem aos respectivos titulares; o projeto não atribui licença aberta a esses recursos.

## Novidades da 0.3.3

- Sprites voltam às plataformas corretas; efeitos de golpes e status não alteram sua posição.
- Sons de golpes e impactos mais audíveis, sem mudar o volume da música.
- Saldo fixo em todas as telas da jornada e cartões da equipe no painel verde.
- Pós-game em dupla permite equipe nova com dois iniciais ou uma equipe campeã, nos modos Clássico e Permadeath.
- Campeões no Clássico desmaiam sem morrer, recuperam-se no Centro Pokémon, podem ir para o PC da jornada e ser reutilizados em outro pós-game clássico. O registro original da Liga não muda.
- Só o Permadeath consome uma tentativa por equipe campeã. Escolher uma equipe nova preserva as tentativas das campeãs.
- Tempo de jogo por jornada do jogo base e pós-game, no Trainer Card, histórico e tela de vitória. Conta somente com o jogo em primeiro plano; saves anteriores começam a registrar a partir desta atualização.
- Conquistas permanentes por concluir cada modo do pós-game, com equipe vencedora e tempo no Diário do Treinador → Conquistas. Últimos 100 registros detalhados; os desbloqueios permanecem.
- Falha ao iniciar o pós-game não consome a tentativa da campeã. Selecionar um modo diferente do da Liga não muda o outro save.

O tempo é salvo durante os autosaves e a cada 30 segundos enquanto a jornada está aberta. Não recupera o tempo jogado antes desta atualização. Entrar no pós-game com uma equipe campeã exige um slot livre no modo escolhido; continuar uma jornada existente segue pelo menu Continuar.


Aplicativo Electron para Windows x64 com dois modos de jornada, mapas 2D em Phaser, conta Google ou e-mail/senha, salvamento local e sincronização Firebase. O aplicativo abre maximizado.

## Instalar ou atualizar

Execute `Pokemon-Permadeath-Setup-0.3.4.exe`. O mesmo aplicativo, diretório de dados e sessão de conta são preservados. O instalador não apaga os saves. A fonte ZIP é destinada ao desenvolvimento, não precisa ser extraída para jogar.

O repositório de atualizações é https://github.com/Ryannzadas/pokemon-permadeath-updates. A compilação usa `--publish never`: nenhuma Release é publicada automaticamente. Para publicar a versão, anexe o EXE, o `.exe.blockmap` correspondente e `latest.yml` na mesma Release; cole as notas da versão (`docs/versoes/`) na descrição.

`latest.yml` contém versão, nome, tamanho e hash do instalador; não contém chaves privadas ou tokens GitHub. A configuração Firebase de cliente identifica o projeto; a proteção dos dados depende das regras de acesso do Firebase. Não inclua credenciais administrativas nem tokens de publicação no aplicativo.

## Correção 0.3.3 — Sylveon

Eevee evolui para Sylveon depois de subir de nível com amizade de pelo menos 160 e um golpe Fada entre seus quatro golpes equipados. Vale de dia ou de noite. A condição tem prioridade sobre Espeon e Umbreon; para essas evoluções, retire o golpe Fada dos golpes ativos. Golpes só na lista de aprendidos não contam.

O sumário mostra a condição e informa quando falta subir outro nível. O aumento de amizade por si só não libera Sylveon: é preciso subir de nível nas condições certas. Saves antigos não recebem uma evolução retroativa; podem equipar Encantar/Charm ou Olhos de Bebê/Baby-Doll Eyes pelo sumário e subir um nível. O botão de evolução mantém a escolha e a animação existentes, inclusive cancelamento.

Sylveon tem stats, aprendizado por nível/TM de Sword/Shield, tipo Fada com relações de dano próprias, sprites frente/costas e grito offline. Eevee recebeu Baby-Doll Eyes no nível 15; Charm passa a ser Fada. A 0.3.4 usa a tipagem atual de toda a base, incluindo Fada para Azumarill e outras espécies que receberam esse tipo. Cute Charm consta como habilidade com efeito ainda pendente, seguindo a indicação do sumário.

O snapshot do [PokeAPI CSV](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) está em `build/sylveon-snapshot.json`. Após regenerar a base geral, execute `python3 scripts/add-sylveon-data.py` para reaplicar a extensão. `tests/sylveon.cjs` cobre condições, prioridade, save, stats e eficácia; `tests/sylveon-ui.cjs` cobre evolução/cancelamento reais na interface e persistência.

Testes locais e de interface passaram, incluindo a regressão dos dois modos. Instalador, conteúdo empacotado e hash de atualização foram conferidos. A execução do EXE e uma atualização publicada ainda requerem validação no Windows.

## Recursos da 0.3.2

- Um save de cada modo por conta. Continuar mostra a escolha quando ambos existem. Encerrar, substituir ou perder uma jornada preserva a do outro modo. Saves anteriores são migrados sem perder a equipe. Pokédex, conquistas e cosméticos permanecem compartilhados.
- Clássico sem treino e com cura gratuita no Centro. Interações de mouse ou E com a enfermeira e o PC exigem proximidade. Derrota completa conserva a equipe, envia ao Centro e mantém a perda de 20% do dinheiro já existente.
- Treino Permadeath sem captura, limitado a três tentativas por etapa. Todos os Pokémon que entraram vivos recuperam HP ao terminar, vencer, perder ou interromper. Pokémon que já estavam mortos permanecem mortos. Itens consumidos e PP usados não são restaurados pelo treino.
- XP recebido por Pokémon e aumento de nível aparecem no resultado. A equipe reserva viva recebe a parte de experiência prevista pelo motor; Pokémon mortos não recebem XP.
- Antes de cada ginásio, Explore a área oferece encontros selvagens com captura sem avançar a etapa. São três encontros extras por ginásio no Permadeath e livres no Clássico. Não renovam missões, interações do acampamento nem estoque de relíquias.
- Navegação fixa, botão contextual de retorno, scroll preservado, categorias e cartões reorganizados, informações extensas recolhidas em Detalhes. Botões claros no menu da jornada. Texto não selecionável fora de campos editáveis.
- Loja com Suprimentos, Evolução, Equipáveis e TM/HM. Os TM/HM vão para a mochila e cada ensino consome uma unidade. O golpe aprendido pode ser equipado novamente. O sumário mostra apenas os itens equipáveis e TM/HM compatíveis que você possui; a lista completa de compatibilidade fica recolhida.
- Sprites locais de itens do PokeAPI. Correção do enquadramento de Snivy e dos Pokémon sem atlas de caminhada. N adicionado à seleção de treinadores.
- Sem playlist manual. Músicas de menus são sorteadas a cada entrada e seguem para outra faixa ao terminar. HGSS continua; trilhas de cidades, batalhas e abertura de Diamond/Pearl e Black 2/White 2 foram adicionadas. Centro e Mart conservam temas próprios.
- Efeitos de golpes em volume reduzido, impactos por eficácia, animações de aumento/redução de atributos e condições. Imunidade e erro não produzem som de dano. Alterações de atributos respeitam o alvo e os limites reais.
- Aviso de atualização disponível, progresso do download e opção de reiniciar e instalar. Batalhas bloqueiam instalação; o app salva e retorna ao título antes de instalar, mantendo a verificação de sincronização pendente.

## Jornadas, Liga e pós-game

Os oito líderes usam equipes de 2, 2, 3, 3, 4, 4, 5 e 6 Pokémon. A Liga mantém Will, Koga, Bruno e Karen com cinco Pokémon cada, seguida por Lance e Blue com seis cada, com preparação entre os campeões. As equipes são adaptações das aparições nos jogos. A Liga termina na vitória 70.

O PC pertence à jornada. A Pokédex e o histórico são permanentes. No pós-game em dupla, escolha uma nova equipe com dois iniciais ou uma equipe campeã com pelo menos dois sobreviventes. A cópia da campeã volta à espécie inicial e ao nível 5; o registro original mantém a forma final. Só o Permadeath consome uma tentativa da campeã e fica indisponível após conclusão ou derrota. No Clássico, a equipe pode ser reutilizada e os desmaiados voltam no Centro. É possível escolher outro modo, mantendo o save independente de cada um.

## Acampamento e Centro

WASD, setas ou clique no chão movem o personagem; E ou clique próximo interagem. Esc fecha a interação ou retorna à jornada. Controles de direção atendem telas pequenas.

Brincar dá +3 amizade; lanche custa ₽15 e dá +5. Há três interações por etapa, renovadas por uma vitória que avança a jornada. Acampamento não restaura HP nem PP. Perfil, som e avisos de atualização preservam a cena em andamento.

Os Pokémon de gerações 1–4 usam os atlas disponíveis. Espécies sem atlas usam o sprite de batalha recortado pela área visível, com animação de repouso. O ajuste de tamanho não cria quadros de caminhada inexistentes.

## Conta e salvamento

O diretório de dados é `pokemon-permadeath-desktop`. Credenciais usam Electron safeStorage. Saves locais são gravados atomicamente; os dois modos são guardados no mesmo documento sincronizado, sem novos campos de configuração obrigatórios no Firebase. Faça backup do diretório de dados antes de testar uma versão nova.

Google e E-mail/senha devem estar habilitados no Firebase Authentication; o fluxo local de login usa `127.0.0.1` autorizado. Verificação e recuperação de senha usam e-mails do Firebase. Usuários Google adicionam senha pelo perfil da mesma conta para preservar o UID e o progresso. E-mail esquecido depende da recuperação do provedor; o aplicativo não revela contas cadastradas.

Atualizações não são instaladas ao fechar automaticamente. A instalação explícita exige título sem batalha pendente, sem conflito e com sincronização pendente concluída. O instalador não é assinado digitalmente.

## Desenvolvimento e testes

O arquivo `firebase-config.json` (configuração web do Firebase: apiKey, authDomain, projectId e appId) não fica no repositório. Copie-o para a raiz do projeto antes de `npm start` ou `npm run dist:win`; o instalador continua levando esse arquivo.

Requer Node.js/npm. Execute `npm ci`, `npm test`, `npm start` ou `npm run dist:win`. O build fica em `dist/`. `npm run verify:package` compara os arquivos empacotados com a fonte e verifica a versão do `package.json` (inclusive as de teste), cabeçalhos Windows do executável e do instalador e, quando há `latest.yml`, o SHA-512 da atualização.

Comandos de teste:

| Comando | O que cobre |
| --- | --- |
| `npm test` | Modelos, batalhas, saves por modo, diário, autenticação, servidor e regras do atualizador |
| `npm run test:ui` | Telas HTML com o motor desligado: jornada, loja, exploração, acampamento, Social, formulários |
| `npm run test:engine` | Cenas do motor de jogo pelo teclado: batalha, menus, jornada, mundos de caminhada e batalha online |
| `npm run test:interface` | Interface React, telas, duplas, inicialização, navegação e telas pequenas |
| `npm run test:approved` / `test:visual` | Telas aprovadas e layout visual |
| `npm run test:online` | Social com dois jogadores, Pokédex nacional no Team Builder e administração de ligas |
| `npm run test:full` | Todos os anteriores, em sequência |

`npm test` executa modelos, batalhas, saves por modo, diário, autenticação e regras do atualizador. `npm run test:ui` exige Playwright no caminho `CODEX_PRIMARY_RUNTIME_NODE_MODULES` e Chromium em `BROWSER_PATH`; opcionalmente use `BROWSER_SINGLE_PROCESS=1` em ambientes limitados. Os testes servem o jogo localmente e usam dados temporários. Verificam navegação, nomes, modo, treino, inventários, compra/ensino, cura por proximidade, notificações, colisões, falhas de gravação, continuidade do Phaser e layouts em 1280, 720 e 360 px.

Os testes locais usam serviços de conta e atualização simulados. A execução real do EXE, entrega de e-mails, sincronização entre dispositivos e atualização publicada de ponta a ponta precisam de validação em Windows com a conta configurada.

O template NSIS em `build/nsis` usa WriteUninstaller durante a instalação para permitir compilação Linux sem executar Windows. Mantém os fluxos de instalação, atualização e desinstalação existentes.

## Dados e assets

Aprendizados e habilidades: snapshot da geração 5 do [PokeAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv). Sprites de Pokémon/itens: [PokeAPI sprites](https://github.com/PokeAPI/sprites). Sprites ficam no pacote, sem consulta de rede durante o jogo. Itens adaptados de evolução por local/troca reutilizam imagens equivalentes disponíveis no acervo; não há sprite oficial correspondente a cada item customizado.

Nomes em português preservam os anteriores e dados de WatWowMap/pogo-data-api; a opção English muda os nomes dos golpes. O motor implementa dano, tipos, PP, prioridade, cura, atributos, condições e uma seleção inicial de habilidades. Efeitos especiais ainda não suportados não reproduzem integralmente o simulador oficial.

Músicas e sons foram fornecidos pelo usuário. A importação nova contém 30 temas de cidades, 33 de batalha, duas aberturas, 548 efeitos de golpes e três impactos. Todos os MP3 novos passaram decodificação completa. Os 11 golpes sem arquivo utilizável usam o impacto genérico: Gust, Mist, Mirror Move, Lick, Cotton Spore, Extreme Speed, Nature Power, Charge, Heart Swap, Inferno e Assist. Foram preferidas partes iniciais dos efeitos quando disponíveis para separar o impacto.

Ferramentas de preparação: `scripts/collect-update-audio.py` (ffmpeg), `scripts/collect-item-sprites.py` e scripts de recorte de atlas (Pillow/NumPy/SciPy). Elas não são dependências para jogar.

Phaser 3.90.0 usa licença MIT incluída em `game/vendor/PHASER-LICENSE.txt`. Pokémon e sua arte/música pertencem aos respectivos titulares. Sprites fornecidos incluem Ethan por Zender1752, Cynthia e Cyrus por AveonTrainer e N em estilo GBA por RHcks. O cenário é desenhado pelo código. Memorial opcional e desafio diário separado continuam adiados.
