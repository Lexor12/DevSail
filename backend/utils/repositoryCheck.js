//Este archivo, permite validar si un repositorio de GitHub, GitLab o Bitbucket es público y existe,
//este retorna false cuando la plataforma responde 404, es decir que no existe o es privado
function buildApiUrl(repositoryUrl, platform) {
    const parsed = new URL(repositoryUrl.trim());
    // Quitamos las diagonales de las orillas y el .git del final
    const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '').split('/');
    const owner = segments[0];
    const repo = segments[1];

    if (platform === 'github') {
        return `https://api.github.com/repos/${owner}/${repo}`;
    }
    if (platform === 'gitlab') {
        // GitLab pide la ruta completa codificada, por ejemplo usuario%2Frepo
        return `https://gitlab.com/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}`;
    }
    return `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}`;
}

async function repositoryExists(repositoryUrl, platform) {
    try {
        const response = await fetch(buildApiUrl(repositoryUrl, platform), {
            headers: { 'User-Agent': 'DevSail' },
            signal: AbortSignal.timeout(5000) // Maximo 5 segundos de espera
        });
        return response.status !== 404;
    } catch (error) {
        // Si la plataforma no contesta o nos limita las consultas, lo dejamos pasar para no bloquear al usuario
        console.error('No se pudo revisar el repositorio:', error.message);
        return true;
    }
}

module.exports = { repositoryExists };

