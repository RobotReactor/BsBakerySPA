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

// Certificate generation logic (ensure dotnet dev-certs https ran successfully)
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

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: { // Moved build config outside resolve
        outDir: 'build',
    },
    server: {
        // --- Proxy Configuration ---
        proxy: {
            '/api': { // Forward requests starting with /api
                target: target, // To your backend server
                changeOrigin: true,
                secure: false, // Allow self-signed certs
            }
        },
        // --- Frontend Server Port & HTTPS ---
        port: 5173, // Vite dev server port
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
        // Removed the extra nested 'server' object here
    }
});
