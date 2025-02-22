import { logManager } from '../log-manager';
import { Setting } from '../models/Setting';
import { TrackItem } from '../models/TrackItem';
import { logService } from './log-service';

const LOGIN_SETTINGS = 'LOGIN_SETTINGS';
const ENTITY_SETTINGS = 'ENTITY_SETTINGS';
type LoginSettings = {
    token: string;
};
export class SettingsService {
    logger = logManager.getLogger('SettingsService');

    cache: any = {};

    async findCreateFind(name: string) {
        return Setting.query()
            .where('name', name)
            .then(function (rows) {
                if (rows.length === 0) {
                    return Setting.query().insert({ name });
                } else {
                    return rows[0];
                }
            });
    }

    async findByName(name: string): Promise<Setting> {
        if (this.cache[name]) {
            this.logger.debug(`Returning ${name} from cache:`, this.cache[name].toJSON());
            return this.cache[name];
        }

        const item = await this.findCreateFind(name);

        this.logger.debug(`Setting ${name} to cache:`, item && item.toJSON());
        this.cache[name] = item;

        return item;
    }

    async updateByName(name: string, jsonDataStr: any) {
        this.logger.debug('Updating Setting:', name, jsonDataStr);

        try {
            const jsonData = JSON.parse(jsonDataStr);

            let item = await this.findByName(name);

            if (item) {
                const savedItem = await item.$query().patchAndFetch({ jsonData });

                this.cache[name] = savedItem;
                return savedItem;
            } else {
                this.logger.error(`No item with ${name} found to update.`);
            }
        } catch (e) {
            this.logger.error('Parsing jsonData failed:', e, jsonDataStr);
            logService
                .createOrUpdateLog({
                    type: 'ERROR',
                    message: `Parsing jsonData failed: ${e.message} | ${jsonDataStr}`,
                    jsonData: e.toString(),
                })
                .catch(console.error);
        }
    }

    async fetchWorkSettings() {
        let item = await this.findByName('WORK_SETTINGS');
        if (!item || !item.jsonData) {
            return {};
        }

        return item.jsonData;
    }

    async getLoginSettings() {
        let item = await this.findByName(LOGIN_SETTINGS);
        if (!item || !item.jsonData) {
            return null;
        }

        return item.jsonData;
    }

    async updateLoginSettings(data: Partial<LoginSettings>) {
        const jsonStr = JSON.stringify(data);
        return this.updateByName(LOGIN_SETTINGS, jsonStr);
    }

    async upsertEntitySetting(data: { projectId: number; entityId: number; entityType: string }) {
        const setting = await Setting.query().where('name', ENTITY_SETTINGS);

        if (setting[0]) {
            await this.updateByName(ENTITY_SETTINGS, JSON.stringify(data));
        } else {
            await Setting.query().insert({ name: ENTITY_SETTINGS, jsonData: data});
        }
    }

    async fetchEntitySettings() {
        let item = await this.findByName(ENTITY_SETTINGS);
        if (!item || !item.jsonData) {
            return null;
        }

        return item.jsonData;
    }

    isObject(val) {
        return val instanceof Object;
    }

    async fetchAnalyserSettings() {
        // this.logger.debug('Fetching ANALYSER_SETTINGS:');
        let item = await this.findByName('ANALYSER_SETTINGS');
        // this.logger.debug('Fetched ANALYSER_SETTINGS:', item.toJSON());
        if (!item || !Array.isArray(item.jsonData)) {
            // db default is object but this is initialized with array (when is initialized)
            return [];
        }
        return item.jsonData;
    }

    async fetchAnalyserSettingsJsonString() {
        const data = await this.fetchAnalyserSettings();

        return JSON.stringify(data);
    }

    async getRunningLogItemAsJson() {
        let settingsItem = await this.findByName('RUNNING_LOG_ITEM');

        if (settingsItem && settingsItem.jsonData && settingsItem.jsonData.id) {
            let logItem = await TrackItem.query().findById(settingsItem.jsonData.id);
            if (!logItem) {
                this.logger.error(`No Track item found by pk: ${settingsItem.jsonData.id}`);
                return null;
            }

            return logItem.toJSON();
        }

        return null;
    }

    async saveRunningLogItemReference(logItemId) {
        const item = await this.updateByName('RUNNING_LOG_ITEM', JSON.stringify({ id: logItemId }));
        this.logger.debug('Updated RUNNING_LOG_ITEM!', logItemId);
        return logItemId;
    }
}

export const settingsService = new SettingsService();
