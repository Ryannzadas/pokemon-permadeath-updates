# Ativar o multiplayer gratuito — Render (0.4.0)

O servidor das batalhas roda no Render Free. Login, saves, amigos e partidas usam o projeto Firebase `pokemon-permadeath`, no plano Spark. Não precisa contratar Blaze nem publicar Cloud Functions.

## 1. Criar o repositório do servidor

1. Extraia `Pokemon-Permadeath-Servidor-Render-0.4.0.zip`.
2. No GitHub, crie um repositório **privado**, por exemplo `pokemon-permadeath-servidor`. O repositório das atualizações continua separado.
3. Use **Add file → Upload files** e envie o conteúdo da pasta extraída. `render.yaml`, `package.json` e `render.cjs` devem ficar na raiz do repositório, junto de `runtime`.
4. Nunca envie a chave privada do Firebase para o GitHub ou para uma release.

## 2. Gerar a credencial do Firebase

1. Abra https://console.firebase.google.com/ e entre no projeto `pokemon-permadeath`.
2. Na engrenagem, abra **Configurações do projeto → Contas de serviço → SDK Admin do Firebase**.
3. Clique em **Gerar nova chave privada** e baixe o JSON. É uma credencial de servidor: guarde-a em particular, não envie no chat nem aos jogadores.

## 3. Criar o servidor no Render

1. Crie sua conta em https://dashboard.render.com/ e conecte o GitHub.
2. Clique **New → Web Service** e escolha o repositório privado do servidor.
3. Preencha:

| Campo | Valor |
|---|---|
| Name | `pokemon-permadeath-social` (ou um nome disponível) |
| Language / Runtime | Node |
| Root Directory | deixe vazio |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Instance Type | **Free** |
| Health Check Path | `/health` |

4. Em **Environment**, adicione:
   - `NODE_VERSION` = `22.16.0`
   - `FIREBASE_PROJECT_ID` = `pokemon-permadeath`
   - `GOOGLE_APPLICATION_CREDENTIALS` = `/etc/secrets/firebase-service-account.json`
5. Em **Secret Files**, crie `firebase-service-account.json` e cole nele **todo o conteúdo do JSON da chave privada**. Essa chave fica somente no servidor, nunca no aplicativo.
6. Clique **Deploy Web Service**. Se o serviço iniciar antes de você adicionar o Secret File, adicione-o e faça **Manual Deploy → Deploy latest commit**.
7. Quando estiver **Live**, copie o endereço `https://nome.onrender.com`.
8. Abra `https://nome.onrender.com/health` no navegador: deve aparecer um JSON com `"ok":true`.

O arquivo `render.yaml` também permite usar um Blueprint; o fluxo manual acima costuma ser mais simples para o primeiro servidor.

## 4. Conectar o jogo

1. Instale a edição **0.4.0 Render**, entre na sua conta e confirme o e-mail.
2. Abra **Amigos e ligas → Conexão multiplayer**.
3. Cole o endereço HTTPS do Render e clique **Conectar**. Ele fica salvo neste computador.
4. Seus amigos usam a mesma versão e o mesmo endereço, cada um com sua conta.
5. O Team Builder permite todas as espécies disponíveis, independente da jornada. Salve um time, adicione o ID do amigo, aceite a amizade e convide pelo botão direito ou por **⋯**.

Não compartilhe o JSON privado. Os jogadores recebem apenas o instalador e o endereço público do servidor.

## Limites do gratuito

- Render Free suspende o servidor após 15 minutos sem tráfego. O primeiro acesso pode levar cerca de um minuto; aguarde a mensagem de conexão. Não usamos serviços artificiais para mantê-lo acordado.
- Amigos, ligas e partidas ficam no Firestore e sobrevivem aos reinícios do Render. Não usamos banco temporário do Render.
- As franquias de Render e Firestore são limitadas. Mantenha **Free no Render**, **Spark no Firebase** e não adicione forma de pagamento para evitar cobrança automática por excedentes no Render. Ao atingir cotas, o serviço pode parar até a renovação.
- A interface consulta o social a cada 30 segundos e partidas a cada 5 segundos; presença e reconexão gravam com intervalo. O botão Atualizar continua disponível.
- Se você já ativou Blaze ou adicionou faturamento, esta troca não cancela esse plano automaticamente. Verifique a cobrança antes de mudar qualquer plano; não é necessário ativá-lo para esta opção.

## Problemas comuns

- **Adicione o Secret File**: confira o nome exato `firebase-service-account.json`.
- **Outro projeto Firebase**: use a chave do projeto `pokemon-permadeath`.
- **Permission denied / indisponível**: confira se o Firestore está criado e se a conta de serviço possui acesso ao banco e à verificação de usuários.
- **Sessão expirada**: saia da conta no título e entre novamente.
- **Confirme seu e-mail**: use a confirmação enviada ao endereço da conta.
- **Iniciando / demorando**: espere o serviço ficar Live e teste `/health`; depois use Conectar novamente.
- Nenhuma regra pública para amigos ou partidas é necessária: o servidor valida a identidade e acessa o banco com o Admin SDK. Preserve suas regras atuais de saves.

## Testes e limites da entrega

O adaptador HTTP foi testado localmente com autenticação simulada, limites de pedidos, duas identidades, amizade, URL permitida e gravação reduzida de presença. O motor e a interface continuam com testes locais. A publicação real no Render e o acesso ao seu Firebase dependem da configuração acima e ainda precisam ser testados com suas contas.

Documentação: https://render.com/docs/free · https://render.com/docs/configure-environment-variables · https://firebase.google.com/docs/admin/setup · https://firebase.google.com/docs/firestore/quotas
