try {
    const f = require('./index.js');
    console.log('Require success', Object.keys(f));
} catch (e) {
    console.error('Require failed:', e.message);
    if (e.code) console.error('Code:', e.code);
}
