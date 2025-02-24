const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

const app = express();

// Carregar certificados
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });

// Configurações do servidor
const PORT = 3000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para redirecionar em caso de erro de certificado
app.use((err, req, res, next) => {
    if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || 
        err.code === 'CERT_HAS_EXPIRED' ||
        err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        res.redirect('/ssl-instructions.html');
    } else {
        next(err);
    }
});


// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Novo cliente conectado');

    let nickname = 'Anônimo';
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'nickname') {
                nickname = data.content;
            } else if (data.type === 'message') {
                console.log(`Mensagem recebida de ${nickname}: ${data.content}`);
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'message',
                            content: data.content,
                            nickname: data.nickname || nickname,
                            timestamp: new Date().toISOString()
                        }));
                    }
                });
            } else {
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            }
        } catch (error) {
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });

    ws.on('error', (error) => {
        console.error('Erro na conexão WebSocket:', error);
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor HTTPS rodando na porta ${PORT}`);
    console.log(`Acesse https://localhost:${PORT} para testar a aplicação`);
    console.log('Atenção: O navegador pode mostrar um aviso de segurança');
    console.log('Isso é normal pois estamos usando um certificado autoassinado');
    console.log('Você pode prosseguir com o acesso clicando em "Avançado" e "Continuar"');
});
