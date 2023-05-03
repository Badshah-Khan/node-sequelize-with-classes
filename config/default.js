module.exports = {
    port: 3001,
    postgres: {
        database: 'ecommerce',
        user: 'postgres',
        password: 'postgres',
        host: 'localhost'
    },
    app: {
        password: {
            passwordMinLength: 6,
            restoreTime: 3600 * 24,
            policy: '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\\W)',
        }
    },
    security: {
        jwt: {
            secret: 'DNSD32CVB5655XCBC',
            expiresIn: '12h',
            algorithm: 'RS256'
        }
    }
}