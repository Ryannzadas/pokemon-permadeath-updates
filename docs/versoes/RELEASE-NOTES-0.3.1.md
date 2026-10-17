# Pokémon Permadeath — 0.3.1

Uma pausa na aventura, um personagem para sua jornada e novas escolhas entre batalhas.

## Dois modos de jogo

- O botão **Jogar** abre uma tela para escolher **Permadeath** ou **Clássico**, com uma explicação curta de cada modo. Depois você escolhe o treinador e o Pokémon inicial.
- **Permadeath:** desmaios são permanentes; perder toda a equipe encerra a jornada.
- **Clássico:** perder toda a equipe leva ao **Centro Pokémon**, recupera HP e PP, desconta **20% do dinheiro** e mantém a mesma etapa da jornada. Reviver também está disponível para recuperar companheiros desmaiados entre batalhas.
- Fechar o aplicativo durante uma batalha conta como derrota conforme o modo escolhido. Treinos mantêm suas próprias regras.
- O modo fica fixado na jornada. Saves antigos continuam em Permadeath. Trainer Card, menu e histórico identificam o modo.

## Personagem e Trainer Card

- Escolha a aparência do treinador e, em seguida, dê um nome próprio ao personagem.
- Cada jornada tem seu personagem. O apelido da conta continua separado.
- Jornadas antigas pedem a escolha ou o nome que estiver faltando, preservando Pokémon, itens, progresso e recompensas pendentes.
- Abra o **Trainer Card** no menu da jornada ou no acampamento para ver nome, retrato, insígnias, vitórias, capturas e companheiros vivos.

## Acampamento 2D

- Caminhe entre barraca, árvores, pedras, fogueira e lago, acompanhado pelos Pokémon vivos da equipe.
- Use **WASD/setas**, clique no chão ou os controles de toque. Clique em um Pokémon ou pressione **E** perto dele. **Esc** fecha a interação ou retorna à jornada.
- Brincar dá **+3 de amizade**. Oferecer um lanche custa **₽15** e dá **+5**.
- São **3 interações por etapa**, renovadas ao vencer uma batalha da jornada. Treinar, sair ou reabrir o aplicativo não renova o limite.
- Treinador, posição e amizade entram no save da jornada e na sincronização da conta. Abrir perfil, playlist ou Trainer Card preserva a cena.

## Centro Pokémon com caminhada

- No Clássico, a derrota leva ao interior do Centro Pokémon, com seu treinador e a equipe recuperada.
- Caminhe com WASD/setas, clique ou controles de toque. Fale com a enfermeira e abra o PC usando **E** por perto ou clicando.
- O Centro também pode ser visitado pelo menu do Clássico. Tratamento entre batalhas custa **₽60**, recuperando HP, PP e condições de status de toda a equipe, inclusive dos desmaiados.
- Caminhar até a porta retorna à jornada. A posição e a permanência no Centro são salvas; abrir o perfil preserva a cena.
- Música própria de **Poké Center**, separada da nova faixa de **Poké Mart** enviada para a loja.

## Caminhos, eventos e missões

- Escolha **Floresta, Caverna ou Lago** pelo menu da jornada. Os caminhos favorecem encontros de Planta/Inseto, Pedra/Terra e Água, respectivamente. As equipes da Liga permanecem próprias de cada treinador.
- Eventos ocasionais entre batalhas permitem ajudar um Pokémon, conversar com um viajante ou explorar a paisagem, com escolhas e benefícios pequenos. Não há missões de entrega de itens.
- Três missões acompanham a jornada: observar **8 espécies**, alcançar **120 de amizade** com um Pokémon vivo e participar de **3 eventos**.
- Receba os cosméticos pela tela **Missões da jornada**: títulos **Observador, Companheiro leal e Viajante**, com avatares de **Psyduck, Umbreon e Espeon**.
- Os objetivos recomeçam em uma nova jornada, mas títulos e avatares recebidos permanecem na conta, inclusive após uma derrota. As recompensas também aparecem no Diário do Treinador.

## Estratégia nas batalhas

- Primeira etapa das habilidades: **17 efeitos** implementados, incluindo Overgrow, Blaze, Torrent, Swarm, Levitate, Water Absorb, Volt Absorb, Thick Fat, Adaptability, Intimidate, Guts e imunidades a condições de status.
- As habilidades seguem os slots normais das espécies na geração 5, com preservação do slot nas evoluções quando compatível. Habilidades cujo efeito ainda não foi implementado são identificadas no sumário.
- **Oran Berry, Sitrus Berry, Lum Berry, Leftovers, Choice Band, Life Orb e Focus Sash** disponíveis na aba **Itens equipáveis** da loja e equipáveis pelo sumário, um por Pokémon.
- Trocar ou retirar um item devolve o anterior à mochila. Berries e Focus Sash são consumidos ao ativar nas batalhas, inclusive nos treinos. Os demais itens permanecem equipados.
- Choice Band aumenta o dano físico em 50% e prende o primeiro golpe usado até trocar ou encerrar a batalha. Life Orb aumenta o dano em 30% e custa 1/10 do HP máximo após causar dano. Focus Sash permite sobreviver a um golpe fatal com 1 HP quando o portador estava com HP cheio.
- Os efeitos funcionam em batalhas simples e em duplas. Itens equipáveis não revivem Pokémon desmaiados.
- A loja separa **Suprimentos e evolução** de **Itens equipáveis**, com a descrição dos efeitos antes da compra.
- Dinheiro por vitória aumentado: base de **₽40 + ₽6 por etapa**, com bônus de líderes e relíquias. Representa aproximadamente **50–60% a mais** sobre os valores anteriores. Treinos não dão dinheiro.

## Áudio e aplicativo

- Removidas as músicas GB e o botão de alternar a trilha. Mantida a trilha **HGSS**, com migração automática das configurações antigas.
- O aplicativo abre **maximizado**, com os controles normais da janela.
- Mantidos conta Google/e-mail, sincronização, saves e fluxo de atualização existentes.

## Observações para esta atualização

- O teste do acampamento fazia parte da **0.3.1**. Quem instalou aquele teste precisa executar este novo instalador para receber o restante, pois ambos têm o mesmo número de versão.
- Os 25 Pokémon de quinta geração presentes no jogo ainda usam a imagem de batalha no acampamento, até substituirmos pela folha original de caminhada em melhor resolução.
- Memorial opcional e desafio diário separado continuam para uma etapa futura.

## Arquivos da Release

Anexe **Pokemon-Permadeath-Setup-0.3.1.exe**, **Pokemon-Permadeath-Setup-0.3.1.exe.blockmap** e **latest.yml**. Cole o conteúdo deste documento no campo de notas da Release. O ZIP de código-fonte é opcional para quem deseja desenvolver o projeto.

Esta preparação não publica uma Release automaticamente. Os testes do jogo e da interface e a integridade do pacote foram conferidos; a instalação e a atualização de ponta a ponta precisam ser testadas no Windows.
