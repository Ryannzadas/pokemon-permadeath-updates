# Correções da 0.4.0 — Render

- Corrigida a posição do cursor após digitar na busca do Team Builder, incluindo edição no meio da palavra e seleção de texto. Campos ativos preservam texto, seleção e rolagem durante atualizações de tela.
- Team Builder permite as 288 espécies disponíveis no jogo, independente de capturas ou conquistas das jornadas. A Pokédex das jornadas continua registrando seu progresso normalmente. Golpes, habilidades, itens e regras da liga continuam validados no servidor.
- Saves modificados durante um envio à nuvem são enviados novamente após a primeira operação. Erros de envio aparecem como falha de sincronização e preservam o save local. A conexão ao Render não substitui a sincronização do progresso com Firebase.
- Coleção e Social não esticam juntas. Abrir uma seção fecha a outra.
- Coleção → Jornadas clássicas fica sempre visível, com acesso à jornada clássica atual e às cópias de jornadas concluídas. Vitórias antigas entram como registros quando existe histórico ou equipe campeã identificada como Clássico, sem duplicar o mesmo resultado e sem misturar Permadeath. A continuação pela lista preservou equipe, níveis, dinheiro, PC e itens no teste de recarga; o save do Permadeath permaneceu independente.

## Instalar a correção

Extraia `Pokemon-Permadeath-Instalador-0.4.0-Corrigido.zip`, feche o jogo e execute o instalador da pasta extraída. É a mesma versão 0.4.0, corrigida para teste. Não foi publicada uma release. Seus dados continuam na pasta de usuário existente.

## Atualizar o servidor do Team Builder

1. No GitHub, abra o repositório privado `server-pokemonpermadeath`.
2. Entre na pasta `Pokemon-Permadeath-Servidor-Render-0.4.0`.
3. Use Add file → Upload files e envie o novo `social-service.cjs`, substituindo o arquivo de mesmo nome nessa pasta.
4. Confirme a alteração. No Render, aguarde a publicação automática ou use Manual Deploy → Deploy latest commit.

O endereço do servidor e seu Secret File permanecem os mesmos. Não envie a credencial privada para o GitHub. É preciso atualizar o aplicativo e esse arquivo do servidor para permitir Pokémon não capturados no multiplayer.

## Saves antigos

A opção Jornadas clássicas exibe os saves e cópias realmente disponíveis. Um histórico de vitória ou uma equipe campeã não contém necessariamente o progresso completo (dinheiro, PC, mochila, etapa). A mudança no menu não reconstrói registros ausentes de versões anteriores. Se sua jornada não aparecer também em Continuar → Clássico, exporte o save em Perfil → Exportar save para análise antes de iniciar outra jornada desse modo.

## Verificação

Testes locais do motor, conta, sincronização concorrente, salvamento por modo, HTTP multiplayer, digitação real no navegador, Pokédex vazia com Team Builder completo, menus exclusivos e recarga/retomada da jornada clássica passaram. O instalador Windows foi verificado como pacote; sua execução no Windows e os saves específicos da sua conta precisam do teste no seu computador.
