import React, { createContext, useContext, useEffect, useState } from 'react';

interface Settings {
    modelName: string;
    resolution: string;
    theme: 'dark' | 'light';
    language: string;
    lastUploadPath?: string;
    autoSave: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    modelName: 'medium',
    resolution: '1080p',
    theme: 'dark',
    language: '',
    autoSave: true,
};

const SettingsContext = createContext<{
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
}>({
    settings: DEFAULT_SETTINGS,
    updateSettings: () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const stored = localStorage.getItem('subcio_settings');
            return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
        } catch (e) {
            console.error('Failed to load settings:', e);
            return DEFAULT_SETTINGS;
        }
    });

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('subcio_settings', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
