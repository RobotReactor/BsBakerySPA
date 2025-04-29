import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "bsbakeryspa.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}
if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    console.log(`Attempting to create/export dev certificate at: ${certFilePath}`);
    const result = child_process.spawnSync('dotnet', [
        'dev-certs', 'https', '--export-path', certFilePath, '--format', 'Pem', '--no-password',
    ], { stdio: 'inherit' });
    if (result.status !== 0) {
        throw new Error(`Could not create certificate. dotnet dev-certs command failed with status ${result.status}.`);
    }
    console.log('Certificate created successfully.');
} else {
    console.log(`Certificate files found at: ${certFilePath} and ${keyFilePath}`);
}

const defaultBackendPort = 5285;
const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : `https://localhost:${defaultBackendPort}`;
console.log(`Proxy target set to: ${target}`);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        outDir: 'build',
    },
    server: {
        proxy: {
            '/api': {
                target: target,
                changeOrigin: true,
                secure: false,
            }
        },
        port: 5173,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
});
