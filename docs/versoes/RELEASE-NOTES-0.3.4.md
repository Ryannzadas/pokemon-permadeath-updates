# Pokémon Permadeath — 0.3.4

- **Limite de nível** por etapa no Clássico e Permadeath, incluindo pós-game em dupla. XP e Doce Raro param no limite e voltam a valer ao avançar. Pokémon antigos acima do limite não perdem níveis; apenas aguardam o progresso. XP excedente não fica guardado.
- **Comprar por quantidade:** escolha quantas unidades quer e veja o preço total. Vale para Poké Bolas, poções, Éter, Elixir, Reviver no Clássico, doces, pedras e outros itens de evolução, itens equipáveis e TM/HM. Até 999 por compra, respeitando o saldo; relíquias continuam com uma unidade. Compras são revertidas se o salvamento falhar.
- **Tipagem corrigida:** usa os tipos atuais do catálogo, incluindo Azumarill e Marill como Água/Fada e Azurill como Normal/Fada. Também revisa os golpes Fada. Equipe e PC de saves antigos recebem a correção ao continuar.
- **Insígnias com sprites de HGSS:** oito insígnias de Kanto na jornada e Trainer Card; as ainda não conquistadas aparecem apagadas.
- **Avisos após a batalha:** mostram os Pokémon que subiram de nível e os novos golpes aprendidos, incluindo a reserva e os treinos do Permadeath. Aparecem brevemente, um Pokémon por vez, com opção de fechar. O resultado mantém as informações; os golpes ficam no sumário. Há aviso ao desbloquear uma evolução após a batalha e ao concluí-la; não repete a mesma disponibilidade a cada batalha.
- **Troca após desmaio:** adicionada proteção para reabrir a escolha obrigatória se a batalha estiver aguardando com o ativo desmaiado e houver reserva viva. Exploração antes de ginásios verificada nos dois modos após golpe, veneno e tentativas de fuga/captura.

| Desafio | Limite |
| --- | ---: |
| Brock | 10 |
| Misty | 15 |
| Lt. Surge | 20 |
| Erika | 26 |
| Janine | 31 |
| Sabrina | 36 |
| Blaine | 41 |
| Giovanni | 47 |
| Will | 52 |
| Koga | 57 |
| Bruno | 62 |
| Karen | 68 |
| Lance | 73 |
| Blue | 78 |

O limite sobe ao vencer cada desafio. Depois da Liga, chega a 100; uma nova jornada em dupla começa com o limite inicial. Saves e contas são preservados.

Testes de regras, compras e interface realizados. O problema original de troca não se reproduziu nos cenários testados; a proteção cobre o estado de espera com Pokémon desmaiado. A instalação e atualização no Windows ainda precisam de validação nesse sistema.

---

**Para publicar:** cole estas notas na descrição da Release `v0.3.4`. Anexe `Pokemon-Permadeath-Setup-0.3.4.exe`, `Pokemon-Permadeath-Setup-0.3.4.exe.blockmap` e `latest.yml`. O ZIP da fonte é opcional. Nada é publicado automaticamente.
