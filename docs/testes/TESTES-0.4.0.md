# Validação da build de teste 0.4.0

- Modelos e motor: tipos atuais, limite de nível, relógio de jogo, saves por modo, Sylveon, PP, trocas, habilidades, itens, efeitos, diário, conta e atualizador.
- Interface: compras por quantidade e rollback, insígnias, exploração com troca após desmaio, pós-game, acampamento, Centro Pokémon, missões, Team Builder, continuação da Liga, mapa de caminhada, troca por evolução e filtros da Pokédex.
- Multiplayer: duas sessões independentes, amizade por ID, convite pelo botão direito, escolha de time, turno com dano/PP reais, resultado e retorno pela barra fixa. A jornada local permaneceu intacta.
- Servidor: acesso restrito aos participantes, convites repetidos, comandos duplicados/atrasados, itens do adversário separados, trocas nas duplas e campeão de liga.
- Layout: telas novas verificadas em largura de 360 pixels e telas existentes em múltiplas larguras. Sem erros de JavaScript ou arquivos ausentes nesses fluxos.
- Instalador: conteúdo do pacote comparado ao código testado; versão, configuração, ícone do executável, dependências do atualizador, checksum SHA-512 e blockmap verificados.

As verificações de interface foram executadas no Chromium em Linux. O arquivo Windows foi gerado e inspecionado; sua execução/instalação no Windows ainda precisa do teste do usuário. O serviço Firebase foi preparado, mas não publicado, e as regras ainda precisam ser aplicadas ao projeto para liberar o online.

O motor reaproveita as adaptações do jogo atual. A biblioteca de testes não demonstra equivalência integral com todas as regras dos jogos oficiais.
