function atualizarPerfilDiscord(userId) {
    // Se nenhum userId for especificado, usar o ID da Bia por padrão
    const targetUserId = userId || '744990694887653427';
    
    // Backup current avatar src in case fetch fails
    const avatarImg = document.querySelector('.avatarImage');
    const avatarBackupSrc = avatarImg ? avatarImg.src : '';
    // Local fallback file (put your uploaded fallback image at this path)
    const localFallback = '/img/113bf3eb.png';

    // Safety onerror handler to swap to local fallback if image fails to load
    if (avatarImg) {
        avatarImg.addEventListener('error', function onAvatarError(e) {
            // Prevent infinite loop if fallback also fails
            if (this.dataset._avatarErrorHandled) return;
            this.dataset._avatarErrorHandled = '1';

            // Log the image load error
            try {
                console.error('Avatar image failed to load:', this.src, e);
                const statusEl = document.querySelector('.status-debugging');
                if (statusEl) {
                    statusEl.textContent = `${new Date().toISOString()} — Avatar failed to load: ${this.src}`;
                    statusEl.style.color = 'red';
                }
            } catch (logErr) {
                // ignore logging errors
            }

            // Prefer backup src, otherwise local fallback
            if (avatarBackupSrc) {
                this.src = avatarBackupSrc;
            } else {
                this.src = localFallback;
            }
            // remove listener after handling
            this.removeEventListener('error', onAvatarError);
        });
    }

    // Centralized logger helper (writes to console and `.status-debugging` if present)
    function logError(msg, err) {
        try {
            console.error(msg, err || '');
            const statusEl = document.querySelector('.status-debugging');
            if (statusEl) {
                const time = new Date().toISOString();
                const errText = err && err.message ? `${err.message}` : (err ? String(err) : '');
                statusEl.textContent = `${time} — ${msg}${errText ? ' : ' + errText : ''}`;
                statusEl.style.color = 'red';
            }
        } catch (e) {
            // ignore logging errors
        }
    }

    // URL atualizada para apontar para o endpoint específico do usuário
    fetch(`https://discorduserstatus-2-0.onrender.com/status/${targetUserId}`)
    .then(response => {
        if (!response.ok) {
            // capture response body for debugging when possible
            response.text().then(text => logError(`Fetch failed (status ${response.status})`, text)).catch(() => logError(`Fetch failed (status ${response.status})`));
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        // Atualizar a foto do perfil (se disponível)
        if (avatarImg && data.avatarUrl) {
            // Adicionar parâmetro de tempo para evitar cache
            const avatarSrc = data.avatarUrl.includes('?') ? 
                data.avatarUrl + '&t=' + Date.now() : 
                data.avatarUrl + '?t=' + Date.now();
            
            avatarImg.src = avatarSrc;
            console.log(`Avatar do usuário ${targetUserId} atualizado:`, avatarSrc);
        } else if (avatarImg) {
            // If API didn't return an avatar, restore the backup (avoid broken/empty image)
            avatarImg.src = avatarBackupSrc || localFallback || avatarImg.src;
        }
        
        // Atualizar o status
        const statusImg = document.querySelector('.discordStatus');
        if (statusImg) {
            // Usar o caminho correto da imagem baseado no status
            switch(data.status) {
                case 'online': statusImg.src = '/img/online.png'; break;
                case 'idle': statusImg.src = '/img/idle.png'; break;
                case 'dnd': statusImg.src = '/img/dnd.png'; break;
                default: statusImg.src = '/img/offline.png';
            }
            console.log(`Status do usuário ${targetUserId} atualizado para:`, data.status);
        } else {
            console.error('Elemento .discordStatus não encontrado no DOM');
        }
        
        // Se você quiser mostrar o nome de usuário também
        const usernameElement = document.querySelector('.username');
        if (usernameElement && data.username) {
            usernameElement.textContent = data.username;
        }
    })
    .catch(error => {
        logError('Erro ao buscar status', error);
        // Restore avatar image if fetch failed (use backup or local fallback)
        try {
            const avatarImgFallback = document.querySelector('.avatarImage');
            if (avatarImgFallback) {
                if (avatarBackupSrc) avatarImgFallback.src = avatarBackupSrc;
                else avatarImgFallback.src = localFallback;
            }
        } catch (e) {
            logError('Failed restoring avatar fallback', e);
        }
    });
}

// Determinar qual usuário monitorar com base na página
function determinarUsuarioPagina() {
    // Você pode usar diferentes métodos para determinar qual usuário exibir
    // Por exemplo, baseado na URL ou em algum elemento na página
    
    // Exemplo: verificar se estamos na página específica do seu perfil
    const currentPath = window.location.pathname;
    if (currentPath.includes('meuperfil') || currentPath.includes('perfil2')) {
        // Seu ID de usuário
        return '744990694887653427';
    }
    
    // Por padrão, retornar o ID da Bia
    return '744990694887653427';
}

// Forçar atualização completa quando o documento carrega
document.addEventListener('DOMContentLoaded', function() {
    // Do not clear the avatar immediately; keep the existing image until a successful fetch
    // Determinar qual usuário monitorar
    const userId = determinarUsuarioPagina();
    
    // Chamar a função para atualizar
    atualizarPerfilDiscord(userId);
    
    // Chamar a função periodicamente para manter atualizado
    setInterval(() => atualizarPerfilDiscord(userId), 5000); // 5sec
});

// Adicionar evento de clique manual para forçar atualização
const avatarImg = document.querySelector('.avatarImage');
if (avatarImg) {
    avatarImg.addEventListener('click', function() {
        console.log('Atualizando avatar manualmente...');
        const userId = determinarUsuarioPagina();
        atualizarPerfilDiscord(userId);
    });
}
