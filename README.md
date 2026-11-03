# HEMU 5S — Frontend React

Interface web do Sistema de Auditoria 5S do Hospital Estadual da Mulher, preparada para trabalhar com o backend **HEMU_5S_Backend_PostgreSQL_API** (API Node.js/Express, PostgreSQL e JWT). Não é um frontend de demonstração com dados fictícios: as telas consultam os endpoints do servidor.

## Funcionalidades

- **Autenticação:** login com e-mail e senha da API; token JWT mantido em `sessionStorage` durante a aba do navegador; ação de sair e troca de senha (que encerra a sessão).
- **Dashboard por ciclo:** setores ativos, auditorias concluídas/pendentes, ações abertas, notas, média aritmética, média harmônica, qualificação MFC e STRIKES por senso. Atualização manual ou a cada 60 segundos quando a aba está visível.
- **Auditoria setorial:** 43 critérios de checklist, com respostas SIM, NÃO, N/A, Pendente; cadastro de ocorrência e desconto STRIKE por não conformidade; conclusão e reabertura exclusivas da Qualidade.
- **Evidências:** fotos **ANTES** e **DEPOIS** (JPG/PNG/WebP, até 5 MB) vinculadas a cada ocorrência; acesso às imagens via endpoint autenticado (sem links públicos).
- **Acompanhamento:** ação, prazo, status, responsável e nota datada; consulta ao histórico das atualizações.
- **Relatório imprimível:** cabeçalho setorial, indicadores por senso, ocorrência, ações, fotos e campos de ciência. Use o comando de impressão do navegador para salvar em PDF; aguarde as fotos carregarem antes da impressão.
- **Administração:** setores, períodos, usuários, permissões EDITOR/OBSERVADOR por setor, critérios e logs. OBSERVADOR apenas consulta.
- **Sem notas inventadas:** as médias consideram **somente auditorias concluídas**. Notas em andamento são apresentadas como provisórias.

## Requisitos

- Node.js 20+ e npm
- Backend HEMU 5S em `http://localhost:3333` (com PostgreSQL inicializado)

## Executar em desenvolvimento

No diretório `HEMU_5S_Frontend`:

```bash
npm install
npm run dev
```

Acesse <http://localhost:5173>.

O proxy do Vite já encaminha as chamadas `/api/*` para `http://localhost:3333`, então o `.env` do frontend pode permanecer com `VITE_API_URL=` vazio. Para API remota no desenvolvimento, configure `VITE_API_URL=https://api.exemplo.org` e ajuste `CORS_ORIGIN` no servidor.

## Build do React

```bash
npm run build
npm run preview
```

O build cria `dist/`. **Não basta publicar apenas `dist/` no Netlify:** as telas dependem da API Express e do PostgreSQL funcionando, com endpoints `/api/*` acessíveis. A configuração fornecida no pacote integrado usa Nginx como proxy e executa os três componentes em rede Docker.

## Contas e permissões

**ADMIN (Qualidade):** cadastra setores/ciclos, preenche itens do checklist, define notas, emite relatórios, conclui/reabre auditorias e atribui acessos.

**EDITOR (responsável):** para seus setores designados, acompanha apontamentos, inclui evidências antes/depois e registra atualizações de planos; não altera a nota.

**OBSERVADOR:** consulta dados apenas dos setores que a Qualidade liberar. Não é autorizado a registrar/editar informações.

O frontend desabilita controles conforme o perfil, mas a **autorização efetiva é feita pelo backend**. Não deixe senhas, chaves JWT ou parâmetros reais de banco em variáveis `VITE_` nem no repositório GitHub.

## Implantação

Para iniciar a solução completa, prefira o arquivo `HEMU_5S_React_Backend_PostgreSQL.zip`: inclui frontend, backend, PostgreSQL, migrações SQL, Docker Compose e `COMECAR_WINDOWS.bat`. Execute somente em ambiente de homologação antes de colocar fotos e registros institucionais reais. Na implantação externa, a TI deve configurar HTTPS, backups, segregação de acesso e política de retenção de evidências.

## Limitações da validação nesta entrega

O código React foi conferido quanto à correspondência com os endpoints da API fornecida. Os **8 testes do backend de cálculo** passaram. Não foi possível instalar as dependências React neste ambiente de criação (registro npm inacessível), portanto o `npm run build` e o funcionamento ponta a ponta com banco, Docker e navegador ainda exigem teste de homologação.
