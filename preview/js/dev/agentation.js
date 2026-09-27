// أداة Agentation للتطوير فقط — تشتغل على localhost بس، وعلى GitHub Pages ما تحمّل شي
const DEV_HOSTS = ['localhost', '127.0.0.1'];

if (DEV_HOSTS.includes(location.hostname)) {
    try {
        const [{ default: React }, { createRoot }, { Agentation }] = await Promise.all([
            import('https://esm.sh/react@18.3.1'),
            import('https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1'),
            import('https://esm.sh/agentation?deps=react@18.3.1,react-dom@18.3.1'),
        ]);

        const container = document.createElement('div');
        container.id = 'agentation-root';
        document.body.appendChild(container);

        // ?deps في الروابط يخلي react و react-dom نسخة وحدة مشتركة مع agentation
        // endpoint = خادم agentation MCP المحلي
        createRoot(container).render(
            React.createElement(Agentation, { endpoint: 'http://localhost:4747' })
        );
    } catch (err) {
        console.warn('Agentation: تعذّر التحميل', err);
    }
}
