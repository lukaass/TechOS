# TechOS - Sistema de Gestão de Assistência Técnica

TechOS é um sistema avançado e moderno para técnicos de informática e eletrônicos, focado em produtividade e mobilidade.

## 🚀 Funcionalidades

- **Dashboard Inteligente**: Métricas em tempo real e gráficos de desempenho.
- **Gestão de OS**: Fluxo completo desde a entrada até a entrega.
- **Controle de Estoque**: Alertas de estoque baixo e gestão de peças.
- **Financeiro**: Controle de entradas, saídas e faturamento.
- **Base de Conhecimento**: Repositório de soluções técnicas.
- **Mobilidade (PWA)**: Instalável no celular para uso em campo.
- **Assinatura Digital**: Coleta de assinatura diretamente na tela.
- **QR Code**: Rastreamento fácil para o cliente.
- **WhatsApp**: Integração para notificações rápidas.

## 🛠️ Tecnologias

- **Frontend**: React, Vite, TailwindCSS, Recharts, Framer Motion.
- **Backend**: Node.js, Express, SQLite (Better-SQLite3).
- **Segurança**: Autenticação JWT e Bcrypt.
- **Documentação**: Geração de PDF com PDFKit.

## 📦 Instalação e Execução

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse o sistema:
   - URL: `http://localhost:3000`
   - Usuário: `admin@techos.com`
   - Senha: `admin123`

## 🚀 Deploy

O sistema está pronto para deploy em ambientes que suportam Node.js.
Certifique-se de configurar as variáveis de ambiente:
- `JWT_SECRET`: Chave secreta para tokens.
- `NODE_ENV`: Definir como `production`.

## 📱 PWA

Para instalar no celular:
1. Acesse a URL do sistema no Chrome (Android) ou Safari (iOS).
2. Clique em "Adicionar à tela de início" ou "Instalar Aplicativo".
