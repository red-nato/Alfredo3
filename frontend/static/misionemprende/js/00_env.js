// ════════════════════════════════════════════════════════════════
//  ARCHIVO: 00_env.js — Resolución del API base URL por entorno
//  Debe cargarse ANTES de 01_config.js (que define apiFetch).
// ════════════════════════════════════════════════════════════════
(function () {
    const LOCAL_API_BASE_URL = 'http://localhost:3000';

    // Terraform/Ansible reemplaza estos valores en la copia que publica.
    const PROD_API_BASE_URL = '';
    const PROD_FRONTEND_BASE_URL = '';
    // Estos valores se inyectan en la copia subida a S3. No son secretos: el
    // control real está en el User Pool, API Gateway y el grupo Cognito Admins.
    const COGNITO_USER_POOL_ID = '';
    const COGNITO_CLIENT_ID = '';
    const COGNITO_HOSTED_UI_DOMAIN = '';
    const COGNITO_ISSUER = '';

    window.MISION_EMPRENDE_COGNITO = {
        userPoolId: COGNITO_USER_POOL_ID,
        clientId: COGNITO_CLIENT_ID,
        hostedUiDomain: COGNITO_HOSTED_UI_DOMAIN,
        issuer: COGNITO_ISSUER,
    };
    window.MISION_EMPRENDE_FRONTEND_BASE_URL = PROD_FRONTEND_BASE_URL;

    if (window.MISION_EMPRENDE_API_BASE_URL) return;

    const stored = localStorage.getItem('misionEmprendeApiBaseUrl');
    if (stored) {
        window.MISION_EMPRENDE_API_BASE_URL = stored;
        return;
    }

    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    window.MISION_EMPRENDE_API_BASE_URL = isLocal ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;
})();
