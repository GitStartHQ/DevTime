import { app } from 'electron';
import { autoUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater';
import config from './config';
import { showNotification } from './notification';

import { logManager } from './log-manager';
import WindowManager from './window-manager';

const logger = logManager.getLogger('AppUpdater');

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

export const CHECK_INTERVAL_MS = ONE_HOUR_MS * 24;

function isNetworkError(errorObject) {
    return errorObject.message.includes('net::ERR');
}

export default class AppUpdater {
    static dialogIsOpen = false;

    static init() {
        autoUpdater.logger = logger;
        (autoUpdater.logger as any).transports.console.level = 'error';

        autoUpdater.on('download-progress', (progressInfo) => {
            logger.debug(`Downloaded: ${Math.round(progressInfo.percent)}% `);
        });

        autoUpdater.on('update-available', (info: UpdateInfo) => {
            showNotification({
                body: `Downloading GitStart DevTime version ${info.version}`,
                title: 'Update available',
                silent: true,
            });
        });

        autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
            logger.debug(`Downloaded GitStart DevTime version ${info.version}`);

            WindowManager.setTrayIconToUpdate();

            showNotification({
                body: `New version is downloaded and ready to install`,
                title: 'Update available',
                silent: true,
            });
        });

        autoUpdater.on('error', (e) => {
            if (isNetworkError(e)) {
                logger.debug('Network error:', e);
            } else {
                logger.error('AutoUpdater error:', e);
                showNotification({
                    title: 'GitStart DevTime update error',
                    body: e ? e.stack || e : 'unknown',
                });
            }
        });

        setInterval(() => AppUpdater.checkForNewVersions(), CHECK_INTERVAL_MS);
    }

    static checkForNewVersions() {
        let isAutoUpdateEnabled = config.persisted.get('isAutoUpdateEnabled');
        isAutoUpdateEnabled =
            typeof isAutoUpdateEnabled !== 'undefined' ? isAutoUpdateEnabled : true;

        if (isAutoUpdateEnabled) {
            logger.debug('Checking for updates.');
            autoUpdater.checkForUpdates();
        } else {
            logger.debug('Auto update disabled.');
        }
    }

    static async checkForUpdatesManual() {
        logger.debug('Checking for updates');
        showNotification({ body: `Checking for updates...`, silent: true });

        try {
            const result: UpdateCheckResult = await autoUpdater.checkForUpdates();

            if (result?.updateInfo?.version) {
                const latestVersion = result.updateInfo.version;
                logger.debug(`Update result ${latestVersion}`);
                const currentVersionString = app.getVersion();

                if (currentVersionString === latestVersion) {
                    showNotification({
                        body: `Up to date! You have version ${currentVersionString}`,
                        silent: true,
                    });
                }
            }
        } catch (e) {
            logger.error('Error checking updates', e);
            showNotification({
                title: 'GitStart DevTime error',
                body: e ? e.stack || e : 'unknown',
            });
        }
    }
}
