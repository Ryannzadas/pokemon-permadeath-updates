# Revisão de batalhas e Team Builder — teste 0.4.0

A versão continua em teste, sem publicação de release.

## Instalar

1. Feche o jogo. Extraia o ZIP do instalador e execute o EXE nos dois computadores.
2. No repositório privado do servidor, substitua o conteúdo de `Pokemon-Permadeath-Servidor-Render-0.4.0` pelo novo pacote, incluindo a pasta `runtime`.
3. Faça commit e aguarde o deploy do Render. Mantenha o Root Directory e o Secret File atuais; não coloque uma pasta de mesmo nome dentro da outra.
4. Entre com as contas existentes. A configuração padrão continua usando `https://server-pokemonpermadeath.onrender.com`.

Não envie uma nova release pública antes do teste com seu amigo.

## Mudanças

- Arena de batalha com fundo, plataformas, HP e comandos por botões no Social e na Liga. As duplas das jornadas também usam a arena compartilhada, sem cartões gigantes.
- Nas duplas online, escolha o golpe e o alvo de cada Pokémon, depois confirme o turno. Pokémon e Mochila abrem menus próprios. Éter permite selecionar o Pokémon e o golpe.
- Troca obrigatória depois de desmaiar; escolhas não enviadas permanecem enquanto aguarda o servidor.
- 1025 espécies padrão no Team Builder e online; as jornadas e a Pokédex das jornadas mantêm seu catálogo.
- Golpes por nível, TM/HM, tutor e ovo reunidos entre gerações, incluindo golpes retidos das formas anteriores. Limite de quatro golpes e validação no servidor.
- Habilidades atuais normais e ocultas por espécie. Nomes e opções dos times antigos são preservados onde são compatíveis; espécies cuja habilidade mudou oficialmente passam a usar o catálogo atual.
- 751 itens equipáveis cadastrados, com busca. Os sete efeitos de itens já implementados continuam ativos; os demais mostram “efeito pendente”. Mega Stones, cristais e outros itens específicos cadastrados não ativam transformações.
- 25 naturezas com +10%/−10% nos atributos correspondentes ou efeito neutro, aplicadas nas batalhas online e mantidas ao salvar, importar e exportar o time.
- 649 sprites oficiais de costas locais. Espécies mais recentes sem esse sprite disponível usam a imagem frontal.
- Música de batalha online ao entrar na arena e trilha de vitória ao terminar.
- Evitado erro de movimento ao destruir uma cena de caminhada durante a troca de telas.
- Corrigido o formato gravado no Firestore para listas de equipes e posições da batalha: o banco rejeita arrays diretamente dentro de arrays. A conversão preserva o estado ao ler novamente.

## Limites atuais

“Efeito pendente” indica que a opção pode ser salva no time, mas sua habilidade ou item não aplica efeito na batalha. Esses efeitos não foram desenvolvidos nesta revisão, conforme combinado. O motor também não implementa integralmente todos os efeitos especiais dos golpes oficiais. Formas alternativas não fazem parte desta expansão. Naturezas nesta revisão pertencem ao Team Builder/online.

## Testar

- Aceitar um convite individual e jogar até o resultado aparecer nos dois computadores.
- Jogar duplas, selecionar os dois golpes/alvos e trocar um Pokémon desmaiado.
- Usar item de cura, Éter e Revive máximo; confirmar desconto da mochila do próprio jogador.
- Criar, iniciar e disputar uma liga; conferir resultado, campeão e edição/exclusão.
- Salvar um time com natureza, habilidade oculta e item; fechar/reabrir, importar/exportar e confirmar as escolhas.
- Abrir uma batalha em dupla da jornada e conferir sprites/HP/controles.

Validação local: modelos, efeitos de naturezas, catálogo e compatibilidade, gravação de batalhas em formato aceito pelo Firestore, interface com dois clientes e trocas em duplas. Os testes de interface usam Chromium em Linux. O instalador Windows é gerado e inspecionado, mas a execução no Windows e o comportamento do Render real precisam do teste de vocês. Se a mensagem de serviço indisponível persistir após atualizar o servidor, o código do erro no log do Render será necessário para identificar a causa restante.

Dados de catálogo: PokeAPI CSV, com os hashes de origem registrados em `online-dex-data.js`.
