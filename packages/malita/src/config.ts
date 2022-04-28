import { existsSync } from 'fs';
import path from 'path';
import { build } from 'esbuild';
import type { Options as ProxyOptions } from 'http-proxy-middleware';
import type { AppData } from './appData';
import type { Server } from 'http';
import { DEFAULT_CONFIG_FILE } from './constants';

export interface UserConfig {
    title?: string;
    keepalive?: any[];
    proxy?: { [key: string]: ProxyOptions };
}
export const getUserConfig = ({ appData, malitaServe }: { appData: AppData; malitaServe: Server; }) => {
    return new Promise(async (resolve: (value: UserConfig) => void, rejects) => {
        let config = {};
        const configFile = path.resolve(appData.paths.cwd, DEFAULT_CONFIG_FILE);

        if (existsSync(configFile)) {
            await build({
                format: 'cjs',
                logLevel: 'error',
                outdir: appData.paths.absOutputPath,
                bundle: true,
                watch: {
                    onRebuild: (err, res) => {
                        if (err) {
                            console.error(JSON.stringify(err));
                            return;
                        }
                        malitaServe.emit('REBUILD', { appData });
                    }
                },
                define: {
                    'process.env.NODE_ENV': JSON.stringify('development'),
                },
                external: ['esbuild'],
                entryPoints: [configFile],
            });
            try {
                const configFile = path.resolve(appData.paths.absOutputPath, 'malita.config.js');
                delete require.cache[configFile];
                config = require(configFile).default;
            } catch (error) {
                console.error('getUserConfig error', error);
                rejects(error);
            }
        }
        resolve(config);
    })
}