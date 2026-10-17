# Batalhas no estilo das jornadas — teste 0.4.0

## Instalar e testar

1. No GitHub do servidor, substitua somente `Pokemon-Permadeath-Servidor-Render-0.4.0/battle-engine.cjs` pelo arquivo deste pacote. Faça commit e aguarde o deploy do Render. As correções de `repository.cjs` e `http-handler.cjs` que já funcionaram devem continuar.
2. Feche o jogo nos dois computadores. Extraia o ZIP do instalador e execute `Pokemon-Permadeath-Setup-0.4.0.exe` nos dois.
3. Teste uma batalha individual e uma dupla no Social ou na Liga.

A versão continua 0.4.0 de teste, sem publicação de release. Sem o novo arquivo do servidor, os comandos funcionam, mas a sequência detalhada das animações não fica disponível.

## Mudanças

- Mesma arena individual das jornadas, com plataformas, barras de HP, tipagem e sprites. Duplas usam a arena compacta compartilhada com as jornadas.
- Golpes aparecem direto nos botões, com cor do tipo, poder e PP. Mochila e Trocar abrem seus próprios menus.
- Sem uma etapa de Lutar ou Confirmar. No individual, a ação é enviada ao escolhê-la; nas duplas, depois das duas escolhas de ação/alvo.
- Animações de ataque, impacto, status e atributos, sons dos golpes e atualização suave de HP na sequência real do turno.
- Nenhuma ação pode ser enviada durante a apresentação do turno. Troca obrigatória após desmaio e espera automática quando apenas o adversário precisa trocar.
- Atualização da batalha a cada segundo enquanto aberta, sem alterar o progresso das jornadas.
- Eventos enviados pelo servidor contêm apenas informações públicas da cena; não revelam os golpes restantes, itens ou PP do adversário.
- Mantida a correção de arrays e nomes de campos do Firestore.

## Verificação

Testes locais do modelo, batalhas, contas e atualizador passaram. Testes com dois clientes passaram para batalha individual/dupla, PP, alvos, troca obrigatória, Éter, resultado, reconexão, navegação e largura de tela pequena. Salvamento foi validado com as restrições de arrays, nomes reservados e profundidade do Firestore. O instalador foi montado e seu conteúdo conferido; o teste final do Windows e do Render deve ser feito nos computadores dos jogadores.

O catálogo do Team Builder continua completo. Efeitos de habilidades e itens ainda marcados como pendentes não foram implementados nesta revisão.
