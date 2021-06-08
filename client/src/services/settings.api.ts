import { EventEmitter } from './EventEmitter';
import { Logger } from '../logger';
import { emit } from 'eiphop';

const { Store } = window as any;

console.log('got back window Store: ', window, Store);
const config = new Store();

export function getOpenAtLogin() {
    return config.get('openAtLogin') as boolean;
}

export function getIsAutoUpdateEnabled() {
    const isAutoUpdateEnabled = config.get('isAutoUpdateEnabled');
    return typeof isAutoUpdateEnabled !== 'undefined' ? (isAutoUpdateEnabled as boolean) : true;
}
export function getIsLoggingEnabled() {
    return config.get('isLoggingEnabled') as boolean;
}

export function saveOpenAtLogin(openAtLogin) {
    if (openAtLogin !== getOpenAtLogin()) {
        EventEmitter.send('openAtLoginChanged');
        config.set('openAtLogin', openAtLogin);
    }
}

export function getThemeFromStorage() {
    const activeTheme = config.get('activeTheme');
    Logger.info('Got theme from storage:', activeTheme);
    return activeTheme;
}

export function saveThemeToStorage(theme) {
    Logger.info('Save theme to storage:', theme);
    config.set('activeTheme', theme);
}

export function saveIsAutoUpdateEnabled(isAutoUpdateEnabled) {
    if (isAutoUpdateEnabled !== getIsAutoUpdateEnabled()) {
        Logger.debug('Setting isAutoUpdateEnabled', isAutoUpdateEnabled);
        config.set('isAutoUpdateEnabled', isAutoUpdateEnabled);
    }
}
export function saveIsLoggingEnabled(isLoggingEnabled) {
    if (isLoggingEnabled !== getIsLoggingEnabled()) {
        Logger.debug('Setting isLoggingEnabled', isLoggingEnabled);
        config.set('isLoggingEnabled', isLoggingEnabled);
    }
}

export async function updateByName(name, jsonData) {
    Logger.debug('updateByName', JSON.stringify(jsonData));

    return emit('updateByName', { name, jsonData: JSON.stringify(jsonData) });
}

export function getRunningLogItem() {
    return emit('getRunningLogItemAsJson');
}

export function fetchWorkSettings() {
    return emit('fetchWorkSettings');
}

export function loginInExternalBrowser() {
    return emit('loginInExternalBrowser');
}

export function fetchLoginSettings() {
    return emit('fetchLoginSettings');
}

export function saveAnalyserSettings(data) {
    updateByName('ANALYSER_SETTINGS', data);
}

export async function fetchAnalyserSettings() {
    const jsonStr = await emit('fetchAnalyserSettingsJsonString');
    Logger.debug('fetchAnalyserSettings', jsonStr);
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        Logger.error('fetchAnalyserSettings', jsonStr, e);
        return [];
    }
}
