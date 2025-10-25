/**
 * Moonlit Echoes Theme for SillyTavern
 * A beautiful theme with extensive customization options
 */

// Global settings and constants
const EXTENSION_NAME = 'Moonlit Echoes Theme';
const extensionName = "SillyTavern-MoonlitEchoesTheme";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const THEME_VERSION = "3.0.0";

// Import required functions for drag functionality
import { dragElement } from '../../../RossAscends-mods.js';
import { loadMovingUIState } from '../../../power-user.js';
import { t } from '../../../i18n.js';
import { tabMappings, themeCustomSettings } from './src/config/theme-settings.js';
import { defaultSettings, ensureSettingsStructure } from './src/config/default-settings.js';
import { settingsKey, getSettings as getExtensionSettings, saveSettings as saveExtensionSettings } from './src/services/settings-service.js';
import { initControls, toggleSettingsPopout } from './src/ui/controls.js';
import {
    configurePresetManager,
    createPresetManagerUI,
    initPresetManager,
    importPreset,
    exportActivePreset,
    updateCurrentPreset,
    saveAsNewPreset,
    deleteCurrentPreset,
    loadPreset,
    applyActivePreset,
    applyPresetToSettings,
    updatePresetSelector,
    handleMoonlitPresetImport,
    syncMoonlitPresetsWithThemeList,
} from './src/ui/preset-manager.js';
import { configureSettingsTabs, createTabbedSettingsUI } from './src/ui/settings-tabs.js';
import { applyAllThemeSettings as applyAllThemeSettingsCore } from './src/core/theme-applier.js';
import { initAvatarInjector, initFormSheldHeightMonitor } from './src/core/observers.js';
import { rgbaToHex, getAlphaFromRgba } from './src/utils/color.js';

// Track if custom chat styles have been added
let customChatStylesAdded = false;
const MOONLIT_LISTENER_KEY = '__moonlitEchoesListeners';

function applyAllThemeSettings(contextOverride) {
    return applyAllThemeSettingsCore(settingsKey, themeCustomSettings, contextOverride);
}

/**
 * Main extension initialization function
 * Executed when the extension loads, configures settings and initializes features
 */
(function initExtension() {
    // Get SillyTavern context
    const context = SillyTavern.getContext();

    // Initialize settings
    let extensionSettings = getExtensionSettings(context);
    if (!extensionSettings) {
        context.extensionSettings[settingsKey] = structuredClone(defaultSettings);
        extensionSettings = getExtensionSettings(context);
    }

    // Ensure settings structure is up-to-date
    ensureSettingsStructure(extensionSettings);

    // Ensure all default setting keys exist
    for (const key of Object.keys(defaultSettings)) {
        if (key !== 'presets' && key !== 'activePreset' && extensionSettings[key] === undefined) {
            extensionSettings[key] = defaultSettings[key];
        }
    }

    // Save settings
    saveExtensionSettings(context);

    // Automatically load or remove CSS based on enabled status
    toggleCss(extensionSettings.enabled);

    // Initialize extension UI when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExtensionUI);
    } else {
        initExtensionUI();
    }
})();

/**
 * Initialize slash commands - only when theme is enabled
 * Register various chat style slash commands for Moonlit Echoes Theme
 */
function initializeSlashCommands() {
    // Get SillyTavern context and check if theme is enabled
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    // Only initialize slash commands when theme is enabled
    if (!settings.enabled) {
        return;
    }

    const SlashCommandParser = context.SlashCommandParser;
    const SlashCommand = context.SlashCommand;

    // Common function to switch chat styles
    function switchChatStyle(styleName, styleValue) {
        try {
            // Get the chat style selector
            const chatDisplaySelect = document.getElementById("chat_display");
            if (!chatDisplaySelect) {
                return `Chat display selector not found.`;
            }

            // Set the selector value
            chatDisplaySelect.value = styleValue;

            // Remove all style classes
            document.body.classList.remove(
                "flatchat",
                "bubblechat",
                "documentstyle",
                "echostyle",
                "whisperstyle",
                "hushstyle",
                "ripplestyle",
                "tidestyle"
            );

            // Add the new style class
            document.body.classList.add(styleName);

            // Save to localStorage
            localStorage.setItem("savedChatStyle", styleValue);

            return t`Chat style switched to ${styleName}`;
        } catch (error) {
            return t`Error switching chat style: ${error.message}`;
        }
    }

    // Register Echo style command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'echostyle',
        description: t`Switch to Echo chat style`,
        callback: (args) => {
            return switchChatStyle("echostyle", "3");
        },
        helpString: t`Switch to Echo chat style by Moonlit Echoes Theme`,
    }));

    // Register Whisper style command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'whisperstyle',
        description: t`Switch to Whisper chat style`,
        callback: (args) => {
            return switchChatStyle("whisperstyle", "4");
        },
        helpString: t`Switch to Whisper chat style by Moonlit Echoes Theme`,
    }));

    // Register Hush style command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'hushstyle',
        description: t`Switch to Hush chat style`,
        callback: (args) => {
            return switchChatStyle("hushstyle", "5");
        },
        helpString: t`Switch to Hush chat style by Moonlit Echoes Theme`,
    }));

    // Register Ripple style command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'ripplestyle',
        description: t`Switch to Ripple chat style`,
        callback: (args) => {
            return switchChatStyle("ripplestyle", "6");
        },
        helpString: t`Switch to Ripple chat style by Moonlit Echoes Theme`,
    }));

    // Register Tide style command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tidestyle',
        description: t`Switch to Tide chat style`,
        callback: (args) => {
            return switchChatStyle("tidestyle", "7");
        },
        helpString: t`Switch to Tide chat style by Moonlit Echoes Theme`,
    }));

    // Register SillyTavern default styles with moonlit- prefix
    // Bubble chat style
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'moonlit-bubble',
        description: t`Switch to Bubble chat style`,
        callback: (args) => {
            return switchChatStyle("bubblechat", "1");
        },
        helpString: t`Switch to Bubble chat style by Moonlit Echoes Theme`,
    }));

    // Flat chat style
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'moonlit-flat',
        description: t`Switch to Flat chat style`,
        callback: (args) => {
            return switchChatStyle("flatchat", "0");
        },
        helpString: t`Switch to Flat chat style by Moonlit Echoes Theme`,
    }));

    // Document style
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'moonlit-document',
        description: t`Switch to Document chat style`,
        callback: (args) => {
            return switchChatStyle("documentstyle", "2");
        },
        helpString: t`Switch to Document chat style by Moonlit Echoes Theme`,
    }));
}

/**
 * Initialize UI elements and events for the extension
 * Includes settings panel, chat style, color picker, and sidebar button
 */
function initExtensionUI() {
    configurePresetManager({
        settingsKey,
        themeVersion: THEME_VERSION,
        t,
        themeCustomSettings,
        applyThemeSetting,
        applyAllThemeSettings,
        updateSettingsUI,
        updateColorPickerUI,
        updateSelectUI,
        updateThemeSelector,
    });

    configureSettingsTabs({
        t,
        tabMappings,
        themeCustomSettings,
        createSettingItem,
        addModernCompactStyles,
    });

    loadSettingsHTML().then(() => {
        renderExtensionSettings();
        initChatDisplaySwitcher();
        initAvatarInjector();

        // Initialize preset manager
        initPresetManager();

        // Apply active preset
        applyActivePreset();

        // Add creator information
        addThemeCreatorInfo();

        // Add modern compact styles
        addModernCompactStyles();

        // Add theme version information
        addThemeVersionInfo();

        // Integrate with theme selector
        integrateWithThemeSelector();

        // Add theme buttons hint
        addThemeButtonsHint();

        // Initialize sidebar button, popout, and message interactions
        initControls({
            settingsKey,
            t,
            dragElement,
            loadMovingUIState,
        });

        // Adds a button to the extensions dropdown menu
        addExtensionMenuButton();

        // Initialize slash commands (only when enabled)
        initializeSlashCommands();

        const context = SillyTavern.getContext();
        const settings = getExtensionSettings(context) || {};
        applyRawCustomCss(settings.rawCustomCss || '');
    });

}

/**
 * Adds a button to the Extensions dropdown menu for Moonlit Echoes Theme
 * This function creates a menu item in SillyTavern's Extensions dropdown
 * that opens the theme settings popup when clicked.
 */
function addExtensionMenuButton() {
    // Select the Extensions dropdown menu
    let $extensions_menu = $('#extensionsMenu');
    if (!$extensions_menu.length) {
        return;
    }

    // Create button element with moon icon and theme name
    let $button = $(`
    <div class="list-group-item flex-container flexGap5 interactable" title="Open Moonlit Echoes Theme Settings" data-i18n="[title]Open Moonlit Echoes Theme Settings" tabindex="0">
        <i class="fa-solid fa-moon"></i>
        <span>Moonlit Echoes</span>
    </div>
    `);

    // Append to extensions menu
    $button.appendTo($extensions_menu);

    // Set click handler to toggle the settings popup
    $button.click(() => {
        toggleSettingsPopout();
    });
}

/**
 * Integrate with theme selector
 * Listen to UI theme selector changes and switch presets automatically
 */
function integrateWithThemeSelector() {
    const themeSelector = document.getElementById('themes');
    if (!themeSelector) {
        return;
    }

    const importButton = document.getElementById('ui_preset_import_button');
    const exportButton = document.getElementById('ui_preset_export_button');
    const deleteButton = document.getElementById('ui-preset-delete-button');
    const updateButton = document.getElementById('ui-preset-update-button');
    const saveButton = document.getElementById('ui-preset-save-button');
    const importFileInput = document.getElementById('ui_preset_import_file');

    attachMoonlitListener(themeSelector, 'change', handleMoonlitThemeChange);

    if (importButton && importFileInput) {
        attachMoonlitListener(importButton, 'click', handleMoonlitImportButtonClick);
    }

    attachMoonlitListener(exportButton, 'click', handleMoonlitExportButtonClick);
    attachMoonlitListener(updateButton, 'click', handleMoonlitUpdateButtonClick);
    attachMoonlitListener(saveButton, 'click', handleMoonlitSaveButtonClick);
    attachMoonlitListener(deleteButton, 'click', handleMoonlitDeleteButtonClick);
    attachMoonlitListener(importFileInput, 'change', handleMoonlitPresetFileImport);

    addThemeButtonsHint();
}

function attachMoonlitListener(element, eventType, handler) {
    if (!element || typeof element.addEventListener !== 'function') return;

    if (!element[MOONLIT_LISTENER_KEY]) {
        element[MOONLIT_LISTENER_KEY] = {};
    }

    const attachedHandlers = element[MOONLIT_LISTENER_KEY];
    if (attachedHandlers[eventType] === handler) {
        return;
    }

    if (attachedHandlers[eventType]) {
        element.removeEventListener(eventType, attachedHandlers[eventType]);
    }

    element.addEventListener(eventType, handler);
    attachedHandlers[eventType] = handler;
}

function getMoonlitSettings() {
    const context = SillyTavern.getContext();
    return getExtensionSettings(context) || {};
}

function isMoonlitPreset(presetName) {
    if (!presetName) return false;
    const settings = getMoonlitSettings();
    const presets = settings.presets || {};
    return Object.prototype.hasOwnProperty.call(presets, presetName);
}

function isMoonlitPresetSelected() {
    const themeSelector = document.getElementById('themes');
    if (!themeSelector) return false;
    return isMoonlitPreset(themeSelector.value);
}

function handleMoonlitThemeChange(event) {
    const themeSelector = event?.currentTarget ?? document.getElementById('themes');
    if (!themeSelector) return;

    const selectedTheme = themeSelector.value;
    if (!isMoonlitPreset(selectedTheme)) {
        return;
    }

    const settings = getMoonlitSettings();
    if (settings.activePreset === selectedTheme) {
        return;
    }

    try {
        loadPreset(selectedTheme);
    } catch (error) {
        // Error handled silently
    }
}

function handleMoonlitImportButtonClick() {
    if (isMoonlitPresetSelected()) {
        importPreset();
    }
}

function handleMoonlitExportButtonClick() {
    if (isMoonlitPresetSelected()) {
        exportActivePreset();
    }
}

function handleMoonlitUpdateButtonClick() {
    if (isMoonlitPresetSelected()) {
        updateCurrentPreset();
    }
}

function handleMoonlitSaveButtonClick() {
    if (isMoonlitPresetSelected()) {
        saveAsNewPreset();
    }
}

function handleMoonlitDeleteButtonClick() {
    if (isMoonlitPresetSelected()) {
        deleteCurrentPreset();
    }
}

function handleMoonlitPresetFileImport(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);
            if (jsonData.moonlitEchoesPreset) {
                handleMoonlitPresetImport(jsonData);
            }
        } catch (error) {
            // Error handled silently
        }
    };
    reader.readAsText(file);
}

/**
 * Add thumbnail tip
 * Add thumbnail setting tip in the settings panel
 */
function addThumbnailTip(container) {
    // Check if tip already added
    if (document.getElementById('moonlit-thumbnail-tip')) return;

    // Create tip container
    const tipContainer = document.createElement('div');
    tipContainer.id = 'moonlit-thumbnail-tip';
    tipContainer.classList.add('moonlit-tip-container');
    tipContainer.style.borderRadius = '5px';
    tipContainer.style.overflow = 'hidden';

    // Create tip header block
    const tipHeader = document.createElement('div');
    tipHeader.classList.add('moonlit-tip-header');
    tipHeader.style.display = 'flex'; // Add flex display
    tipHeader.style.alignItems = 'center'; // Center align items vertically

    // Add small icon with better alignment
    const tipIcon = document.createElement('i');
    tipIcon.classList.add('fa', 'fa-info-circle');
    tipIcon.style.marginRight = '8px';
    tipIcon.style.display = 'flex'; // Make icon a flex container
    tipIcon.style.alignItems = 'center'; // Align icon content vertically
    tipIcon.style.justifyContent = 'center'; // Center icon content horizontally
    tipIcon.style.width = '16px'; // Fixed width
    tipIcon.style.height = '16px'; // Fixed height

    // Add tip title text
    const tipTitle = document.createElement('span');
    tipTitle.textContent = t`Blurry or thumbnail-sized character images in chat?`;
    tipTitle.style.fontWeight = 'normal';

    // Add small expand icon with consistent sizing
    const toggleIcon = document.createElement('i');
    toggleIcon.classList.add('fa', 'fa-chevron-down');
    toggleIcon.style.marginLeft = 'auto';
    toggleIcon.style.fontSize = '0.85em';
    toggleIcon.style.opacity = '0.8';
    toggleIcon.style.transition = 'transform 0.3s';
    toggleIcon.style.display = 'flex'; // Make icon a flex container
    toggleIcon.style.alignItems = 'center'; // Align icon content vertically
    toggleIcon.style.width = '16px'; // Fixed width for consistency
    toggleIcon.style.justifyContent = 'center'; // Center horizontally

    // Assemble title
    tipHeader.appendChild(tipIcon);
    tipHeader.appendChild(tipTitle);
    tipHeader.appendChild(toggleIcon);
    tipContainer.appendChild(tipHeader);

    // Create tip content
    const tipContent = document.createElement('div');
    tipContent.classList.add('moonlit-tip-content');
    tipContent.style.padding = '0';
    tipContent.style.maxHeight = '0';
    tipContent.style.overflow = 'hidden';
    tipContent.style.transition = 'all 0.3s ease';

    // Set tip content, more concise
    tipContent.innerHTML = `
        <div style="line-height: 1.4;">
            <span data-i18n="Please refer to the">Please refer to the</span> <a href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme" target="_blank">Moonlit Echoes Theme GitHub README</a> <span data-i18n="and complete the necessary setup.">and complete the necessary setup.</span>
            </div>
        </div>
    `;

    tipContainer.appendChild(tipContent);

    // Add click event
    tipHeader.addEventListener('click', () => {
        const isExpanded = tipContent.style.maxHeight !== '0px' && tipContent.style.maxHeight !== '0';

        if (isExpanded) {
            // Collapse
            tipContent.style.maxHeight = '0';
            tipContent.style.padding = '0 10px';
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            // Expand
            tipContent.style.maxHeight = '1000px';
            tipContent.style.padding = '10px';
            toggleIcon.style.transform = 'rotate(180deg)';
        }
    });

    // Add to container
    container.appendChild(tipContainer);
}

/**
 * Add slash commands tip
 * Add a tip about available slash commands in the settings panel
 */
function addSlashCommandsTip(container) {
    // Check if tip already added
    if (document.getElementById('moonlit-slashcmd-tip')) return;

    // Create tip container
    const tipContainer = document.createElement('div');
    tipContainer.id = 'moonlit-slashcmd-tip';
    tipContainer.classList.add('moonlit-tip-container');
    tipContainer.style.borderRadius = '5px';
    tipContainer.style.overflow = 'hidden';

    // Create tip header block
    const tipHeader = document.createElement('div');
    tipHeader.classList.add('moonlit-tip-header');
    tipHeader.style.display = 'flex'; // Add flex display
    tipHeader.style.alignItems = 'center'; // Center align items vertically

    // Add small icon with better alignment
    const tipIcon = document.createElement('i');
    tipIcon.classList.add('fa', 'fa-terminal');
    tipIcon.style.marginRight = '8px';
    tipIcon.style.display = 'flex'; // Make icon a flex container
    tipIcon.style.alignItems = 'center'; // Align icon content vertically
    tipIcon.style.justifyContent = 'center'; // Center icon content horizontally
    tipIcon.style.width = '16px'; // Fixed width
    tipIcon.style.height = '16px'; // Fixed height

    // Add tip title text with a more concise title
    const tipTitle = document.createElement('span');
    tipTitle.textContent = t`Chat Style Slash Commands`;
    tipTitle.setAttribute('data-i18n', 'Chat Style Slash Commands');
    tipTitle.style.fontWeight = 'normal';

    // Add small expand icon with consistent sizing
    const toggleIcon = document.createElement('i');
    toggleIcon.classList.add('fa', 'fa-chevron-down');
    toggleIcon.style.marginLeft = 'auto';
    toggleIcon.style.fontSize = '0.85em';
    toggleIcon.style.opacity = '0.8';
    toggleIcon.style.transition = 'transform 0.3s';
    toggleIcon.style.display = 'flex'; // Make icon a flex container
    toggleIcon.style.alignItems = 'center'; // Align icon content vertically
    toggleIcon.style.width = '16px'; // Fixed width for consistency
    toggleIcon.style.justifyContent = 'center'; // Center horizontally

    // Assemble title
    tipHeader.appendChild(tipIcon);
    tipHeader.appendChild(tipTitle);
    tipHeader.appendChild(toggleIcon);
    tipContainer.appendChild(tipHeader);

    // Create tip content
    const tipContent = document.createElement('div');
    tipContent.classList.add('moonlit-tip-content');
    tipContent.style.padding = '0';
    tipContent.style.maxHeight = '0';
    tipContent.style.overflow = 'hidden';
    tipContent.style.transition = 'all 0.3s ease';

    // Set tip content with slash command info and increased list item spacing
    tipContent.innerHTML = `
    <div style="line-height: 1.5;">
        <span style="font-weight:500;" data-i18n="Moonlit Echoes Styles:">Moonlit Echoes Styles:</span>
        <ul style="margin-top: 5px; margin-bottom: 10px; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><code>/echostyle</code> - <span data-i18n="Switch to Echo style">Switch to Echo style</span></li>
            <li style="margin-bottom: 8px;"><code>/whisperstyle</code> - <span data-i18n="Switch to Whisper style">Switch to Whisper style</span></li>
            <li style="margin-bottom: 8px;"><code>/hushstyle</code> - <span data-i18n="Switch to Hush style">Switch to Hush style</span></li>
            <li style="margin-bottom: 8px;"><code>/ripplestyle</code> - <span data-i18n="Switch to Ripple style">Switch to Ripple style</span></li>
            <li><code>/tidestyle</code> - <span data-i18n="Switch to Tide style">Switch to Tide style</span></li>
        </ul>

        <span style="font-weight:500;" data-i18n="SillyTavern Safe Switch Commands:">SillyTavern Safe Switch Commands:</span>
        <ul style="margin-top: 5px; margin-bottom: 10px; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><code>/moonlit-flat</code> - <span data-i18n="Switch to Flat style">Switch to Flat style</span></li>
            <li style="margin-bottom: 8px;"><code>/moonlit-bubble</code> - <span data-i18n="Switch to Bubble style">Switch to Bubble style</span></li>
            <li><code>/moonlit-document</code> - <span data-i18n="Switch to Document style">Switch to Document style</span></li>
        </ul>

        <div style="margin-top: 8px; margin-bottom: 5px; text-align: center;">
            <span data-i18n="For more commands, see">For more commands, see</span>
            <button class="menu_button menu_button_icon inline-flex interactable" onclick="window.open('https://docs.sillytavern.app/usage/st-script/', '_blank')" tabindex="0" style="margin-left: 5px; font-size: 0.9em;">
                <i class="fa-solid fa-terminal"></i>
                <span data-i18n="STscript Reference">STscript Reference</span>
            </button>
        </div>
    </div>
`;

    tipContainer.appendChild(tipContent);

    // Add click event
    tipHeader.addEventListener('click', () => {
        const isExpanded = tipContent.style.maxHeight !== '0px' && tipContent.style.maxHeight !== '0';

        if (isExpanded) {
            // Collapse
            tipContent.style.maxHeight = '0';
            tipContent.style.padding = '0 10px';
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            // Expand
            tipContent.style.maxHeight = '1000px';
            tipContent.style.padding = '10px';
            toggleIcon.style.transform = 'rotate(180deg)';
        }
    });

    // Add to container
    container.appendChild(tipContainer);
}

/**
 * Add theme hint
 * Only show hint when theme is enabled
 */
function addThemeButtonsHint() {
    const themesContainer = document.getElementById('UI-presets-block');
    if (!themesContainer) return;

    // Get settings
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    // Check if theme is enabled
    if (!settings.enabled) {
        // If theme is not enabled, remove any existing hint
        const existingHint = document.getElementById('moonlit-theme-buttons-hint');
        if (existingHint) existingHint.remove();
        return;
    }

    // Check if hint already exists
    if (document.getElementById('moonlit-theme-buttons-hint')) return;

    const hintElement = document.createElement('small');
    hintElement.id = 'moonlit-theme-buttons-hint';
    hintElement.style.margin = '5px 0';
    hintElement.style.padding = '5px 10px';
    hintElement.style.display = 'block';
    hintElement.style.lineHeight = '1.5';

    // Show different hints based on initial theme selector value
    const themeSelector = document.getElementById('themes');
    let currentTheme = themeSelector ? themeSelector.value : '';

    // Still keep checking for "- by Rivelle" to identify presets created by you
    if (currentTheme.includes('- by Rivelle')) {
        // Official Moonlit preset - keep original wording
        hintElement.innerHTML = `<i class="fa-solid fa-info-circle"></i>  <b><span data-i18n="You are currently using the third-party extension theme">You are currently using the third-party extension theme</span> Moonlit Echoes Theme <a href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme" target="_blank">${THEME_VERSION}</a></b><br>
        <small><span data-i18n="Thank you for choosing my theme! This extension is unofficial. For issues, please contact">Thank you for choosing my theme! This extension is unofficial. For issues, please contact</span> <a href="https://github.com/RivelleDays" target="_blank">Rivelle</a></small>`;
        hintElement.style.borderLeft = '3px solid var(--customThemeColor)';
    } else {
        // Other themes - keep original wording
        hintElement.innerHTML = `<i class="fa-solid fa-info-circle"></i>  <b><span data-i18n="You are currently using the third-party extension theme">You are currently using the third-party extension theme</span> Moonlit Echoes Theme <a href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme" target="_blank">${THEME_VERSION}</a></b><br>
        <small><span data-i18n="customThemeIssue">This unofficial extension may not work with all custom themes. Please troubleshoot first; if confirmed, contact</span> <a href="https://github.com/RivelleDays" target="_blank">Rivelle</a></small>`;
        hintElement.style.borderLeft = '3px solid var(--SmartThemeBodyColor)';
    }

    themesContainer.appendChild(hintElement);

    if (themeSelector) {
        themeSelector.addEventListener('change', () => {
            // Only update hint when theme is enabled
            if (settings.enabled) {
                const currentTheme = themeSelector.value;
                if (currentTheme.includes('- by Rivelle')) {
                    // Official Moonlit preset
                    hintElement.innerHTML = `<i class="fa-solid fa-info-circle"></i>  <b><span data-i18n="You are currently using the third-party extension theme">You are currently using the third-party extension theme</span> Moonlit Echoes Theme <a href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme" target="_blank">${THEME_VERSION}</a></b><br>
                    <small><span data-i18n="Thank you for choosing my theme! This extension is unofficial. For issues, please contact">Thank you for choosing my theme! This extension is unofficial. For issues, please contact</span> <a href="https://github.com/RivelleDays" target="_blank">Rivelle</a></small>`;
                    hintElement.style.borderLeft = '3px solid var(--customThemeColor)';
                } else {
                    // Other themes
                    hintElement.innerHTML = `<i class="fa-solid fa-info-circle"></i>  <b><span data-i18n="You are currently using the third-party extension theme">You are currently using the third-party extension theme</span> Moonlit Echoes Theme <a href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme" target="_blank">${THEME_VERSION}</a></b><br>
                    <small><span data-i18n="customThemeIssue">This unofficial extension may not work with all custom themes. Please troubleshoot first; if confirmed, contact</span> <a href="https://github.com/RivelleDays" target="_blank">Rivelle</a></small>`;
                    hintElement.style.borderLeft = '3px solid var(--SmartThemeBodyColor)';
                }
            }
        });
    }
}

/**
* Handle Moonlit Echoes preset import
* @param {Object} jsonData - Imported JSON data
*/
/**
* Update theme selector
* @param {string} presetName - Preset name
*/
function updateThemeSelector(presetName) {
    const themeSelector = document.getElementById('themes');
    if (!themeSelector) return;

    // Only update theme selector when option already exists, don't add any new options
    let optionExists = false;

    // Check if option already exists
    for (let i = 0; i < themeSelector.options.length; i++) {
        if (themeSelector.options[i].value === presetName) {
            optionExists = true;
            themeSelector.selectedIndex = i; // Select that option
            break;
        }
    }

    // Only trigger change event if option exists
    if (optionExists) {
        themeSelector.dispatchEvent(new Event('change'));
    }
}

/**
* Settings UI initialization function - no longer requires external HTML file
* @returns {Promise} Promise for initialization completion
*/
function loadSettingsHTML() {
return new Promise((resolve) => {
    // Since all HTML is now integrated into JavaScript, no need to load from external sources
    // Just return resolved Promise to continue the initialization flow

    // If any initialization operations need to be performed here, can be added here

    // Immediately resolve Promise
    resolve();
});
}

/**
 * Automatically load or remove CSS based on enabled status in settings
 * @param {boolean} shouldLoad - If true, load CSS, otherwise remove
 */
function toggleCss(shouldLoad) {
    // Get existing <link> elements
    const existingLinkStyle = document.getElementById('MoonlitEchosTheme-style');
    const existingLinkExt = document.getElementById('MoonlitEchosTheme-extension');

    if (shouldLoad) {
        // Determine base URL path
        const baseUrl = getBaseUrl();

        // Load theme style
        if (!existingLinkStyle) {
            const cssUrl = baseUrl + '/style.css';
            const linkStyle = document.createElement('link');
            linkStyle.id = 'MoonlitEchosTheme-style';
            linkStyle.rel = 'stylesheet';
            linkStyle.href = cssUrl;
            document.head.append(linkStyle);
        }

        // Load extension style
        if (!existingLinkExt) {
            const extUrl = baseUrl + '/extension.css';
            const linkExt = document.createElement('link');
            linkExt.id = 'MoonlitEchosTheme-extension';
            linkExt.rel = 'stylesheet';
            linkExt.href = extUrl;
            document.head.append(linkExt);
        }

        // Ensure hint is visible
        addThemeButtonsHint();

        // Re-apply all checkbox styles if they were enabled
        updateAllCheckboxStyles(true);
    } else {
        // Remove CSS
        if (existingLinkStyle) existingLinkStyle.remove();
        if (existingLinkExt) existingLinkExt.remove();

        // Remove hint
        const existingHint = document.getElementById('moonlit-theme-buttons-hint');
        if (existingHint) existingHint.remove();

        // Clear all checkbox styles
        clearAllCheckboxStyles();
    }
}

/**
 * Clear all CSS styles added by checkboxes
 */
function clearAllCheckboxStyles() {
    // Find all style elements created by checkboxes
    document.querySelectorAll('style[id^="css-block-"]').forEach(element => {
        element.textContent = '';
    });
}

/**
 * Update all checkbox styles based on their current settings and extension state
 * @param {boolean} extensionEnabled - Whether the extension is enabled
 */
function updateAllCheckboxStyles(extensionEnabled) {
    if (!extensionEnabled) {
        clearAllCheckboxStyles();
        return;
    }

    // Get settings
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    // Go through all checkbox settings and update their styles
    themeCustomSettings.forEach(setting => {
        if (setting.type === 'checkbox' && (setting.cssBlock || setting.cssFile)) {
            const varId = setting.varId;
            const enabled = settings[varId] === true;
            const styleElement = document.getElementById(`css-block-${varId}`);

            if (styleElement) {
                if (setting.cssBlock && enabled) {
                    styleElement.textContent = setting.cssBlock;
                } else {
                    styleElement.textContent = '';
                }
            }
        }
    });
}

/**
* Get the base URL path for the extension
* @returns {string} Base URL for the extension
*/
function getBaseUrl() {
let baseUrl = '';

// Try various possible path retrieval methods
if (typeof import.meta !== 'undefined' && import.meta.url) {
    baseUrl = new URL('.', import.meta.url).href;
} else {
    const currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
        baseUrl = currentScript.src.substring(0, currentScript.src.lastIndexOf('/'));
    } else {
        // If above methods fail, use hardcoded path
        baseUrl = `${window.location.origin}/scripts/extensions/third-party/${extensionName}`;
    }
}

return baseUrl;
}

/**
 * Render extension settings panel - Refactored with tabbed interface
 * Create UI elements and set up event handling
 */
function renderExtensionSettings() {
    const context = SillyTavern.getContext();
    const settingsContainer = document.getElementById(`${settingsKey}-container`) ?? document.getElementById('extensions_settings2');
    if (!settingsContainer) {
        return;
    }

    // Find existing settings drawer to avoid duplication
    let existingDrawer = settingsContainer.querySelector(`#${settingsKey}-drawer`);
    if (existingDrawer) {
        return; // Don't recreate if exists
    }

    // Create settings drawer
    const inlineDrawer = document.createElement('div');
    inlineDrawer.id = `${settingsKey}-drawer`;
    inlineDrawer.classList.add('inline-drawer');
    settingsContainer.append(inlineDrawer);

    // Create drawer title
    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');

    const extensionNameElement = document.createElement('b');
    extensionNameElement.textContent = EXTENSION_NAME;

    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');

    inlineDrawerToggle.append(extensionNameElement, inlineDrawerIcon);

    // Create settings content area
    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');

    // Add to drawer
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    // Get settings
    const settings = getExtensionSettings(context);

    // Add creator
    addThemeCreatorInfo(inlineDrawerContent);

    // Create enable switch
    const enabledCheckboxLabel = document.createElement('label');
    enabledCheckboxLabel.classList.add('checkbox_label');
    enabledCheckboxLabel.htmlFor = `${settingsKey}-enabled`;

    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.id = `${settingsKey}-enabled`;
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = settings.enabled;

    enabledCheckbox.addEventListener('change', () => {
        settings.enabled = enabledCheckbox.checked;
        toggleCss(settings.enabled);

        // Update hint display when enable status changes
        addThemeButtonsHint();

        // Update custom chat styles when enabled status changes
        updateCustomChatStyles();

        // Re-initialize slash commands based on enabled status
        if (settings.enabled) {
            initializeSlashCommands();
        }

        saveExtensionSettings(context);
    });

    const enabledCheckboxText = document.createElement('span');
    enabledCheckboxText.textContent = t`Enable Moonlit Echoes Theme`;

    enabledCheckboxLabel.append(enabledCheckbox, enabledCheckboxText);
    inlineDrawerContent.append(enabledCheckboxLabel);

    // Add spacer for visual spacing
    const spacer = document.createElement('div');
    spacer.style.height = '15px';
    inlineDrawerContent.append(spacer);

    // Create preset manager
    createPresetManagerUI(inlineDrawerContent, settings);

    // Add tips
    addThumbnailTip(inlineDrawerContent);
    addSlashCommandsTip(inlineDrawerContent);

    // Add spacer for visual spacing
    const spacer2 = document.createElement('div');
    spacer2.style.height = '10px';
    inlineDrawerContent.append(spacer2);

    // Create tabbed settings UI
    createTabbedSettingsUI(inlineDrawerContent, settings);

    // Add version information
    addThemeVersionInfo(inlineDrawerContent);

    // Initialize drawer toggle functionality
    inlineDrawerToggle.addEventListener('click', function() {
        this.classList.toggle('open');
        inlineDrawerIcon.classList.toggle('down');
        inlineDrawerIcon.classList.toggle('up');
        inlineDrawerContent.classList.toggle('open');
    });
}

/**
 * Update custom chat styles based on extension enabled status
 */
function updateCustomChatStyles() {
    // No-op: options are now permanent; nothing to add/remove on enable toggle
}

/**
 * Remove custom chat styles when theme is disabled
 */
function removeCustomChatStyles() {
    // Intentionally empty: we no longer remove options when the theme is disabled
}

/**
 * Create tabbed settings UI with state persistence - Updated tab name
 * @param {HTMLElement} container - Container to add tabbed settings
 * @param {Object} settings - Current settings object
 */

/**
 * Populate tab content with sections and settings
 * Modified to support always-expanded first sections
 * @param {Array} tabs - Tab configuration objects
 * @param {HTMLElement} tabContents - Container for tab content
 * @param {Object} settings - Current settings object
 * @param {boolean} firstSectionAlwaysExpanded - Whether to keep first section expanded
 */

/**
 * Enhanced populateTabContent without expand/collapse all buttons
 * @param {Array} tabs - Tab configuration objects
 * @param {HTMLElement} tabContents - Container for tab content
 * @param {Object} settings - Current settings object
 */

/**
 * Save section expand/collapse state to localStorage
 * @param {string} category - Category ID
 * @param {boolean} isExpanded - Whether section is expanded
 */

/**
* Create preset manager UI
* @param {HTMLElement} container - Container to add preset manager
* @param {Object} settings - Current settings object
*/
function updateSettingsUI() {
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    // Update all setting item UIs
    themeCustomSettings.forEach(setting => {
        const { varId, type } = setting;
        const value = settings[varId];

        // Update UI based on setting type
        switch (type) {
            case 'color':
                updateColorPickerUI(varId, value);
                break;
            case 'slider':
                updateSliderUI(varId, value);
                break;
            case 'select':
                updateSelectUI(varId, value);
                break;
            case 'text':
                updateTextInputUI(varId, value);
                break;
            case 'checkbox':
                updateCheckboxUI(varId, value);
                break;
        }
    });
}

/**
* Update color picker UI
* @param {string} varId - Setting variable ID
* @param {string} value - Color value
*/
function updateColorPickerUI(varId, value) {
    // Update color preview
    const colorPreview = document.querySelector(`#cts-${varId}-preview`);
    if (colorPreview) {
        colorPreview.style.background = value;
    }

    // Update Tool Cool Color Picker
    const colorPicker = document.querySelector(`#cts-${varId}-color`);
    if (colorPicker) {
        if (typeof colorPicker.setColor === 'function') {
            colorPicker.setColor(value);
        } else {
            colorPicker.setAttribute('color', value);
        }
    }

    // Update text input field
    const textInput = document.querySelector(`#cts-${varId}-text`);
    if (textInput) {
        const hexValue = rgbaToHex(value);
        textInput.value = hexValue || value;
    }

    // Update opacity slider and value display
    const alphaSlider = document.querySelector(`#cts-${varId}-alpha`);
    const alphaValue = document.querySelector(`#cts-${varId}-alpha-value`);

    if (alphaSlider && alphaValue) {
        const alpha = getAlphaFromRgba(value);
        const alphaPercent = Math.round(alpha * 100);
        alphaSlider.value = alphaPercent;
        alphaValue.textContent = alphaPercent;

        // Update slider color - ensure it always runs
        const hexColor = rgbaToHex(value);
        if (hexColor) {
            // Use delay to ensure DOM has updated
            setTimeout(() => {
                updateColorSliderThumb(varId, hexColor);
            }, 10);
        }
    }
}

/**
* Update slider UI
* @param {string} varId - Setting variable ID
* @param {string|number} value - Slider value
*/
function updateSliderUI(varId, value) {
// Update slider
const slider = document.querySelector(`#cts-slider-${varId}`);
if (slider) {
    slider.value = value;
}

// Update number input
const numberInput = document.querySelector(`#cts-number-${varId}`);
if (numberInput) {
    numberInput.value = value;
}
}

/**
 * Update selector UI - enhanced version
 * @param {string} varId - Setting variable ID
 * @param {string} value - Selection value
 */
function updateSelectUI(varId, value) {
    const select = document.querySelector(`#cts-${varId}`);
    if (!select) return;

    // Find corresponding setting item
    const settingConfig = themeCustomSettings.find(s => s.varId === varId);
    if (!settingConfig || !settingConfig.options) return;

    // Clear existing options
    select.innerHTML = '';

    // Recreate all options
    settingConfig.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        optionElement.selected = value === option.value;
        select.appendChild(optionElement);
    });

    // Set current value
    select.value = value;
}

/**
* Update text input UI
* @param {string} varId - Setting variable ID
* @param {string} value - Text value
*/
function updateTextInputUI(varId, value) {
    const input = document.querySelector(`#cts-${varId}`);
    if (input) {
        input.value = value;
    }
}

/**
* Update checkbox UI
* @param {string} varId - Setting variable ID
* @param {boolean} value - Checkbox state
*/
function updateCheckboxUI(varId, value) {
    const checkbox = document.querySelector(`#cts-checkbox-${varId}`);
    if (checkbox) {
        checkbox.checked = value === true;
    }
}

/**
* Update preset selector
* Repopulate preset selector and select current active preset
*/
/**
 * Add theme creator information to settings panel
 * @param {HTMLElement} [container] - Optional container, uses default settings container if not provided
 */
function addThemeCreatorInfo(container) {
    // Check if creator info already added
    if (document.getElementById('moonlit-echoes-creator')) return;

    // If no container passed, use default settings container
    if (!container) {
        container = document.querySelector('.settings-container');
    }

    // Check if container exists
    if (!container) return;

    // Create creator info container
    const creatorContainer = document.createElement('div');
    creatorContainer.classList.add('moonlit-echoes', 'flex-container', 'flexFlowColumn');
    creatorContainer.style.marginTop = '5px';
    creatorContainer.style.marginBottom = '15px';
    creatorContainer.style.textAlign = 'center';

    // Set HTML content
    creatorContainer.innerHTML = `
        <small id="moonlit-echoes-creator">
            <span>Created with Heartfelt Passion by</span>
            <a href="https://github.com/RivelleDays" target="_blank" rel="noopener noreferrer">Rivelle</a><br>
            <span>Dedicated to All 可愛 (Kind & Wonderful) People</span>
        </small>
    `;

    // Add to settings panel container
    container.appendChild(creatorContainer);
}


/**
* Add theme version information to settings panel
* @param {HTMLElement} container - Container to add version info
*/
function addThemeVersionInfo(container) {
// Check if version info already added
if (document.getElementById('moonlit-echoes-version')) return;

// Check if container exists
if (!container) return;

// Create version info container
const versionContainer = document.createElement('div');
versionContainer.classList.add('moonlit-echoes', 'flex-container', 'flexFlowColumn');
versionContainer.style.marginTop = '5px';
versionContainer.style.marginBottom = '15px';
versionContainer.style.textAlign = 'center';

// Set HTML content
versionContainer.innerHTML = `
    <small class="flex-container justifyCenter alignitemscenter">
        <span data-i18n="Moonlit Echoes Theme Version">Moonlit Echoes Theme Version</span>
        <a id="moonlit-echoes-version"
            href="https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme"
            target="_blank"
            rel="noopener noreferrer"
            style="margin-left: 5px;">${THEME_VERSION}</a>
    </small>
`;

// Add to provided container
container.appendChild(versionContainer);
}

/**
* Add modern compact styles
* Add more modern, more compact UI styles
*/
function addModernCompactStyles() {
// Check if styles already added
if (document.getElementById('moonlit-modern-styles')) {
    return;
}

// Create style element
const styleElement = document.createElement('style');
styleElement.id = 'moonlit-modern-styles';

// Add modern compact CSS styles
styleElement.textContent = `
    /* Basic settings */
    .theme-category-content {
        display: block;
        width: 100%;
        padding: 8px 0;
        overflow-y: auto;
        transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
    }

    /* Single column layout */
    .colors-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    /* Improved setting item container */
    .theme-setting-item {
        margin-bottom: 12px;
    }

    /* Improved category title container */
    .theme-category-header {
        padding: 8px 0 !important;
        margin-bottom: 5px !important;

        h4 {
            font-weight: 700;
        }
    }

    /* Improved labels and descriptions */
    .theme-setting-container label {
        display: block;
        margin-bottom: 4px;
        font-size: 0.95em;
        font-weight: 600;
    }

    .theme-setting-container small {
        display: block;
        margin-bottom: 8px;
        opacity: 0.7;
        font-size: 0.85em;
    }

    /* Improved color picker layout */
    .theme-color-picker {
        max-width: 480px;
    }

    /* Improved dropdown menu */
    select.widthNatural.flex1.margin0 {
        min-width: 185.5px !important;
        max-width: 480px !important;
    }

    /* Setting item uniform width limit */
    .theme-setting-container {
        margin: 8px 0;
    }

    /* Improved slider style */
    input[type="range"].moonlit-neo-range-input {
        height: 6px;
        border-radius: 3px;
    }
    input[type="number"].moonlit-neo-range-input {
        width: 60px;
        height: 32.5px;
        text-align: center;
        border-radius: 5px;
        background-color: var(--black30a);
        border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);;
    }

    /* Improved color picker visual effects */
    .color-preview {
        box-shadow: 0 0 3px var(--black30a);
    }

    /* Improved input box style */
    .theme-setting-container input[type="text"] {
        padding: 5px 8px;
        background-color: var(--black30a);
        border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
        border-radius: 5px;
        color: var(--SmartThemeBodyColor);
    }

    /* Preset manager style */
    .moonlit-preset-manager {
    position: relative;
    background-color: var(--black30a);
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 15px !important;
    border: 1.2px solid color-mix(in srgb, var(--customThemeColor) 50%, transparent);
    box-shadow: 0 0 10px color-mix(in srgb, var(--customThemeColor) 25%, transparent);
    overflow: hidden;
    }

    .moonlit-preset-manager::before {
        content: "";
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 80px;
        height: 80px;
        opacity: 0.15;
        z-index: 0;
        background-color: var(--SmartThemeBodyColor);
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='none' stroke='%23000' stroke-dasharray='4' stroke-dashoffset='4' stroke-linecap='round' stroke-linejoin='round' stroke-width='1'%3E%3Cpath d='M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5'%3E%3Canimate id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0' fill='freeze' attributeName='stroke-dashoffset' begin='0.6s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+6s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+4s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+1.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+3.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+5.2s' dur='0.4s' values='0;4'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+1.8s' to='M12 5h1.5M12 5h-1.5M12 5v1.5M12 5v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+3.8s' to='M12 4h1.5M12 4h-1.5M12 4v1.5M12 4v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+5.8s' to='M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5'/%3E%3C/path%3E%3Cpath d='M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5'%3E%3Canimate id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1' fill='freeze' attributeName='stroke-dashoffset' begin='1s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+6s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+4s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+1.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+3.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+5.2s' dur='0.4s' values='0;4'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+1.8s' to='M17 11h1.5M17 11h-1.5M17 11v1.5M17 11v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+3.8s' to='M18 12h1.5M18 12h-1.5M18 12v1.5M18 12v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+5.8s' to='M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5'/%3E%3C/path%3E%3Cpath d='M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5'%3E%3Canimate id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2' fill='freeze' attributeName='stroke-dashoffset' begin='2.8s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+6s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+2s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+1.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+3.2s' dur='0.4s' values='0;4'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+1.8s' to='M20 5h1.5M20 5h-1.5M20 5v1.5M20 5v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+5.8s' to='M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5'/%3E%3C/path%3E%3C/g%3E%3Cg fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Cg%3E%3Cpath stroke-dasharray='2' stroke-dashoffset='4' d='M12 21v1M21 12h1M12 3v-1M3 12h-1'%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' dur='0.2s' values='4;2'/%3E%3C/path%3E%3Cpath stroke-dasharray='2' stroke-dashoffset='4' d='M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5'%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='0.2s' dur='0.2s' values='4;2'/%3E%3C/path%3E%3Cset fill='freeze' attributeName='opacity' begin='0.5s' to='0'/%3E%3C/g%3E%3Cpath fill='%23000' d='M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z' opacity='0'%3E%3Cset fill='freeze' attributeName='opacity' begin='0.5s' to='1'/%3E%3C/path%3E%3C/g%3E%3Cmask id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition3'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23fff'/%3E%3Ccircle cx='22' cy='2' r='3' fill='%23fff'%3E%3Canimate fill='freeze' attributeName='cx' begin='0.1s' dur='0.4s' values='22;18'/%3E%3Canimate fill='freeze' attributeName='cy' begin='0.1s' dur='0.4s' values='2;6'/%3E%3Canimate fill='freeze' attributeName='r' begin='0.1s' dur='0.4s' values='3;12'/%3E%3C/circle%3E%3Ccircle cx='22' cy='2' r='1'%3E%3Canimate fill='freeze' attributeName='cx' begin='0.1s' dur='0.4s' values='22;18'/%3E%3Canimate fill='freeze' attributeName='cy' begin='0.1s' dur='0.4s' values='2;6'/%3E%3Canimate fill='freeze' attributeName='r' begin='0.1s' dur='0.4s' values='1;10'/%3E%3C/circle%3E%3C/mask%3E%3Ccircle cx='12' cy='12' r='6' mask='url(%23lineMdSunnyFilledLoopToMoonFilledAltLoopTransition3)' fill='%23000'%3E%3Canimate fill='freeze' attributeName='r' begin='0.1s' dur='0.4s' values='6;10'/%3E%3Cset fill='freeze' attributeName='opacity' begin='0.5s' to='0'/%3E%3C/circle%3E%3C/svg%3E");
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='none' stroke='%23000' stroke-dasharray='4' stroke-dashoffset='4' stroke-linecap='round' stroke-linejoin='round' stroke-width='1'%3E%3Cpath d='M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5'%3E%3Canimate id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0' fill='freeze' attributeName='stroke-dashoffset' begin='0.6s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+6s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+4s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+1.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+3.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+5.2s' dur='0.4s' values='0;4'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+1.8s' to='M12 5h1.5M12 5h-1.5M12 5v1.5M12 5v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+3.8s' to='M12 4h1.5M12 4h-1.5M12 4v1.5M12 4v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition0.begin+5.8s' to='M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5'/%3E%3C/path%3E%3Cpath d='M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5'%3E%3Canimate id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1' fill='freeze' attributeName='stroke-dashoffset' begin='1s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+6s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+4s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+1.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+3.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+5.2s' dur='0.4s' values='0;4'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+1.8s' to='M17 11h1.5M17 11h-1.5M17 11v1.5M17 11v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+3.8s' to='M18 12h1.5M18 12h-1.5M18 12v1.5M18 12v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition1.begin+5.8s' to='M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5'/%3E%3C/path%3E%3Cpath d='M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5'%3E%3Canimate id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2' fill='freeze' attributeName='stroke-dashoffset' begin='2.8s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+6s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+2s' dur='0.4s' values='4;0'/%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+1.2s;lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+3.2s' dur='0.4s' values='0;4'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+1.8s' to='M20 5h1.5M20 5h-1.5M20 5v1.5M20 5v-1.5'/%3E%3Cset fill='freeze' attributeName='d' begin='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition2.begin+5.8s' to='M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5'/%3E%3C/path%3E%3C/g%3E%3Cg fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Cg%3E%3Cpath stroke-dasharray='2' stroke-dashoffset='4' d='M12 21v1M21 12h1M12 3v-1M3 12h-1'%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' dur='0.2s' values='4;2'/%3E%3C/path%3E%3Cpath stroke-dasharray='2' stroke-dashoffset='4' d='M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5'%3E%3Canimate fill='freeze' attributeName='stroke-dashoffset' begin='0.2s' dur='0.2s' values='4;2'/%3E%3C/path%3E%3Cset fill='freeze' attributeName='opacity' begin='0.5s' to='0'/%3E%3C/g%3E%3Cpath fill='%23000' d='M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z' opacity='0'%3E%3Cset fill='freeze' attributeName='opacity' begin='0.5s' to='1'/%3E%3C/path%3E%3C/g%3E%3Cmask id='lineMdSunnyFilledLoopToMoonFilledAltLoopTransition3'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23fff'/%3E%3Ccircle cx='22' cy='2' r='3' fill='%23fff'%3E%3Canimate fill='freeze' attributeName='cx' begin='0.1s' dur='0.4s' values='22;18'/%3E%3Canimate fill='freeze' attributeName='cy' begin='0.1s' dur='0.4s' values='2;6'/%3E%3Canimate fill='freeze' attributeName='r' begin='0.1s' dur='0.4s' values='3;12'/%3E%3C/circle%3E%3Ccircle cx='22' cy='2' r='1'%3E%3Canimate fill='freeze' attributeName='cx' begin='0.1s' dur='0.4s' values='22;18'/%3E%3Canimate fill='freeze' attributeName='cy' begin='0.1s' dur='0.4s' values='2;6'/%3E%3Canimate fill='freeze' attributeName='r' begin='0.1s' dur='0.4s' values='1;10'/%3E%3C/circle%3E%3C/mask%3E%3Ccircle cx='12' cy='12' r='6' mask='url(%23lineMdSunnyFilledLoopToMoonFilledAltLoopTransition3)' fill='%23000'%3E%3Canimate fill='freeze' attributeName='r' begin='0.1s' dur='0.4s' values='6;10'/%3E%3Cset fill='freeze' attributeName='opacity' begin='0.5s' to='0'/%3E%3C/circle%3E%3C/svg%3E");
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-size: contain;
        mask-size: contain;
        transform: rotate(-10deg);
    }

    .moonlit-preset-manager > * {
        position: relative;
        z-index: 1;
    }

    .moonlit-preset-manager h4 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 1em;
        opacity: 0.85;
        text-align: left;
        padding: 3px;
        padding-left: 10px !important;
        border-left: 3px solid var(--customThemeColor);
    }

    .moonlit-preset-selector {
        width: 100% !important; /* Ensure full width */
        flex: none !important; /* Remove flex growth */
        padding: 5px 8px;
        background-color: var(--black30a);
        border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
        border-radius: 5px;
        color: var(--SmartThemeBodyColor);
        margin-bottom: 5px !important;
        box-sizing: border-box;
    }
`;

// Add to head
document.head.appendChild(styleElement);
}

/**
* Create custom settings UI
* Generate UI elements for all settings based on themeCustomSettings
* @param {HTMLElement} container - Settings container element
* @param {Object} settings - Current settings object
*/
function createCustomSettingsUI(container, settings) {
const context = SillyTavern.getContext();

// Get setting categories
const categories = {};
themeCustomSettings.forEach(setting => {
    const category = setting.category || 'general';
    if (!categories[category]) {
        categories[category] = [];
    }
    categories[category].push(setting);
});

// Category name mapping
const categoryNames = {
    'colors': t`Theme Color Settings`,
    'background': t`Background Settings`,
    'chat': t`Chat Interface`,
    'visualNovel': t`Visual Novel Mode`,
    'general': t`General Settings`,
    'features': t`Advanced Settings`
};

// Process all category settings
Object.keys(categories).forEach(category => {
    // Create category container
    const categoryContainer = document.createElement('div');
    categoryContainer.classList.add('theme-setting-category');

    // Create collapsible category title container
    const titleContainer = document.createElement('div');
    titleContainer.classList.add('theme-category-header');
    titleContainer.style.cursor = 'pointer';
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.marginBottom = '5px';
    titleContainer.style.padding = '5px 0';
    titleContainer.style.borderBottom = '1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent)';

    // Add expand/collapse icon
    const toggleIcon = document.createElement('i');
    toggleIcon.classList.add('fa', 'fa-chevron-down');
    toggleIcon.style.marginRight = '8px';
    toggleIcon.style.transition = 'transform 0.3s';
    toggleIcon.style.transform = 'rotate(-90deg)'; // Default collapsed state

    // Create category title
    const categoryTitle = document.createElement('h4');
    categoryTitle.textContent = categoryNames[category] || category;
    categoryTitle.style.margin = '0';

    titleContainer.appendChild(toggleIcon);
    titleContainer.appendChild(categoryTitle);
    categoryContainer.appendChild(titleContainer);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('theme-category-content');
    contentContainer.style.transition = 'max-height 0.3s ease-out, opacity 0.2s ease-out';
    contentContainer.style.overflow = 'hidden';
    contentContainer.style.maxHeight = '0px'; // Default collapsed
    contentContainer.style.opacity = '0';
    contentContainer.style.padding = '5px';

    // Create all settings under this category
    categories[category].forEach(setting => {
        const settingContainer = document.createElement('div');
        settingContainer.classList.add('theme-setting-item');

        createSettingItem(settingContainer, setting, settings);
        contentContainer.appendChild(settingContainer);
    });

    // Add collapse event
    let isCollapsed = true; // Default to collapsed state

    titleContainer.addEventListener('click', () => {
        if (isCollapsed) {
            // Expand
            const scrollHeight = contentContainer.scrollHeight;
            contentContainer.style.maxHeight = scrollHeight + 'px';
            contentContainer.style.opacity = '1';
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            // Collapse
            contentContainer.style.maxHeight = '0px';
            contentContainer.style.opacity = '0';
            toggleIcon.style.transform = 'rotate(-90deg)';
        }

        // Toggle state
        isCollapsed = !isCollapsed;
    });

    categoryContainer.appendChild(contentContainer);
    // Add to main container
    container.appendChild(categoryContainer);
});

// Add CSS styles to support compact layout
addModernCompactStyles();
}

/**
* Create single setting item
* @param {HTMLElement} container - Setting container element
* @param {Object} setting - Setting configuration object
* @param {Object} settings - Current settings object
*/
function createSettingItem(container, setting, settings) {
// Create setting item container
const settingContainer = document.createElement('div');
settingContainer.classList.add('theme-setting-container');

// Only create standard labels and descriptions for non-checkbox types
if (setting.type !== 'checkbox') {
    // Create setting item label
    const label = document.createElement('label');
    label.textContent = setting.displayText;
    settingContainer.appendChild(label);

    // If there is a description, add description text
    if (setting.description) {
        const description = document.createElement('small');
        description.textContent = setting.description;
        settingContainer.appendChild(description);
    }
}

// Create different UI elements based on setting type
switch (setting.type) {
    case 'color':    createColorPicker(settingContainer, setting, settings); break;
    case 'slider':   createSlider(settingContainer, setting, settings); break;
    case 'select':   createSelect(settingContainer, setting, settings); break;
    case 'text':     createTextInput(settingContainer, setting, settings); break;
    case 'checkbox': createCheckbox(settingContainer, setting, settings); break;
    case 'textarea': createTextareaInput(settingContainer, setting, settings); break; // <-- new
    default:
        // Unrecognized setting type
}

container.appendChild(settingContainer);
}

/**
 * Create color picker setting item - improved version
 * Support HEX priority display and opacity value display
 * @param {HTMLElement} container - Setting container element
 * @param {Object} setting - Setting configuration object
 * @param {Object} settings - Current settings object
 */
function createColorPicker(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue } = setting;
    const currentValue = settings[varId] || defaultValue;

    // Create color picker container
    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.classList.add('theme-color-picker');
    colorPickerContainer.style.display = 'flex';
    colorPickerContainer.style.alignItems = 'center';
    colorPickerContainer.style.gap = '10px';
    colorPickerContainer.style.padding = '2px 0';
    colorPickerContainer.style.minHeight = '36px';

    // Create color preview box
    const colorPreview = document.createElement('div');
    colorPreview.id = `cts-${varId}-preview`;
    colorPreview.classList.add('color-preview');
    colorPreview.style.width = '30px';
    colorPreview.style.height = '30px';
    colorPreview.style.minWidth = '30px';
    colorPreview.style.minHeight = '30px';
    colorPreview.style.borderRadius = '4px';
    colorPreview.style.border = '1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent)';
    colorPreview.style.background = currentValue;
    colorPreview.style.cursor = 'pointer';
    colorPreview.style.boxShadow = '0 1px 3px var(--SmartThemeShadowColor)';

    // Create text input - prioritize HEX format
    const textInput = document.createElement('input');
    textInput.id = `cts-${varId}-text`;
    textInput.type = 'text';
    // Prioritize HEX format display if possible
    const initialHexValue = rgbaToHex(currentValue);
    textInput.value = initialHexValue || currentValue;
    textInput.classList.add('color-input-text');
    textInput.style.flex = '1';
    textInput.style.minWidth = '80px';
    textInput.style.minHeight = '28px';
    textInput.style.padding = '4px 6px';
    textInput.style.backgroundColor = 'var(--black30a)';
    textInput.style.border = '1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent)';
    textInput.style.borderRadius = '4px';
    textInput.style.color = 'var(--SmartThemeBodyColor)';

    // Create color picker
    const colorInput = document.createElement('input');
    colorInput.id = `cts-${varId}-color`;
    colorInput.type = 'color';
    colorInput.value = rgbaToHex(currentValue) || '#ffffff';
    colorInput.style.width = '1px';
    colorInput.style.height = '1px';
    colorInput.style.opacity = '0';
    colorInput.style.position = 'absolute';
    colorInput.style.pointerEvents = 'auto'; // Allow touch events

    // Create opacity control container
    const alphaContainer = document.createElement('div');
    alphaContainer.style.display = 'flex';
    alphaContainer.style.flexDirection = 'column';
    alphaContainer.style.width = '120px';
    alphaContainer.style.gap = '3px';

    // Create opacity label
    const alphaLabel = document.createElement('span');
    alphaLabel.textContent = t`Opacity`;
    alphaLabel.style.fontSize = '10px';
    alphaLabel.style.opacity = '0.7';
    alphaLabel.style.alignSelf = 'flex-start';

    // Create opacity control row
    const alphaRow = document.createElement('div');
    alphaRow.style.display = 'flex';
    alphaRow.style.alignItems = 'center';
    alphaRow.style.width = '100%';
    alphaRow.style.gap = '5px';

    // Create opacity slider
    const alphaSlider = document.createElement('input');
    alphaSlider.id = `cts-${varId}-alpha`;
    alphaSlider.type = 'range';
    alphaSlider.min = '0';
    alphaSlider.max = '100';
    alphaSlider.step = '1';
    alphaSlider.value = Math.round(getAlphaFromRgba(currentValue) * 100);
    alphaSlider.style.flex = '1';
    alphaSlider.style.height = '5px';
    alphaSlider.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    alphaSlider.style.borderRadius = '2px';
    alphaSlider.style.appearance = 'none';
    alphaSlider.style.outline = 'none';
    alphaSlider.style.cursor = 'pointer';

    // Add more modern style for slider
    alphaSlider.style.background = 'linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.2))';
    alphaSlider.style.backgroundSize = '100% 3px';
    alphaSlider.style.backgroundPosition = 'center';
    alphaSlider.style.backgroundRepeat = 'no-repeat';
    alphaSlider.style.boxShadow = 'inset 0 0 2px var(--SmartThemeBodyColor, rgba(255, 255, 255, 0.3))';

    // Add style for slider thumb
    const thumbStyle = `
        #${alphaSlider.id}::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${initialHexValue || '#ffffff'};
            border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }
        #${alphaSlider.id}::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${initialHexValue || '#ffffff'};
            border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }
    `;

    // Add thumb style to document
    const styleElem = document.createElement('style');
    styleElem.textContent = thumbStyle;
    document.head.appendChild(styleElem);

    // Create opacity value display
    const alphaValue = document.createElement('span');
    alphaValue.id = `cts-${varId}-alpha-value`;
    alphaValue.textContent = alphaSlider.value + '%';
    alphaValue.style.width = '30px';
    alphaValue.style.textAlign = 'right';
    alphaValue.style.fontSize = '12px';
    alphaValue.style.opacity = '0.9';

    // Define a more reliable trigger function
    // This should be placed in the function definition part, before other event listeners

    // Set multiple trigger methods for clicking preview area
    function triggerColorPicker() {
        // Multiple attempts to trigger
        setTimeout(() => {
            try {
                colorInput.click();

                // If first attempt might fail, try again
                setTimeout(() => {
                    colorInput.click();
                }, 50);
            } catch (error) {
                // Error handled silently
            }
        }, 10);
    }

    // Trigger color picker when clicking color preview
    colorPreview.addEventListener('click', (e) => {
        // Prevent event bubbling
        e.preventDefault();
        e.stopPropagation();

        // Use more reliable trigger function
        triggerColorPicker();
    });

    // Add touch event support
    colorPreview.addEventListener('touchstart', (e) => {
        // Prevent event bubbling and default behavior
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    colorPreview.addEventListener('touchend', (e) => {
        // Prevent event bubbling and default behavior
        e.preventDefault();
        e.stopPropagation();

        // Use more reliable trigger function
        triggerColorPicker();
    }, { passive: false });

    // Update when color picker changes
    colorInput.addEventListener('input', () => {
        updateColor();
    });

    // Update when color picker selection is complete
    colorInput.addEventListener('change', () => {
        updateColor();
    });

    // Update when opacity slider changes
    alphaSlider.addEventListener('input', () => {
        const alphaPercent = alphaSlider.value;
        alphaValue.textContent = alphaPercent + '%';
        updateColorAndAlpha();

        // Update thumb color
        const hexColor = colorInput.value;
        updateSliderThumbColor(hexColor);
    });

    // Text input change event
    textInput.addEventListener('change', () => {
        try {
            let color = textInput.value.trim();
            let isValid = false;
            let hexColor, alpha = getAlphaFromRgba(currentValue);

            // Check if valid HEX format
            if (/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(color)) {
                isValid = true;
                hexColor = color;
                // Keep existing opacity
            }
            // Check if valid RGBA format
            else if (/^rgba?\([\d\s,\.]+\)$/.test(color)) {
                isValid = true;
                hexColor = rgbaToHex(color);
                alpha = getAlphaFromRgba(color);
            }

            if (isValid) {
                // Update color picker
                if (hexColor) {
                    colorInput.value = hexColor;
                }

                // Update opacity slider
                const alphaPercent = Math.round(alpha * 100);
                alphaSlider.value = alphaPercent;
                alphaValue.textContent = alphaPercent + '%';

                // Update thumb color
                updateSliderThumbColor(hexColor);

                // Generate RGBA color
                const r = parseInt(colorInput.value.slice(1, 3), 16);
                const g = parseInt(colorInput.value.slice(3, 5), 16);
                const b = parseInt(colorInput.value.slice(5, 7), 16);
                const rgbaColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;

                // Update color preview
                colorPreview.style.background = rgbaColor;

                // Update and apply settings
                settings[varId] = rgbaColor;
                applyThemeSetting(varId, rgbaColor);
                saveExtensionSettings(context);
            } else {
                // Restore to previous value
                const previousHex = rgbaToHex(settings[varId]);
                textInput.value = previousHex || settings[varId] || defaultValue;
            }
        } catch (error) {
            // Restore to previous value
            const previousHex = rgbaToHex(settings[varId]);
            textInput.value = previousHex || settings[varId] || defaultValue;
        }
    });

    // Update slider thumb color
    function updateSliderThumbColor(hexColor) {
        // Generate new thumb style
        const newThumbStyle = `
            #${alphaSlider.id}::-webkit-slider-thumb {
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${hexColor};
                border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                cursor: pointer;
            }
            #${alphaSlider.id}::-moz-range-thumb {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${hexColor};
                border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                cursor: pointer;
            }
        `;

        // Update style
        styleElem.textContent = newThumbStyle;
    }

    // Function to update color
    function updateColor() {
        const hexColor = colorInput.value;
        const alpha = alphaSlider.value / 100;

        // Get RGB part from HEX code
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Generate RGBA color string
        const rgbaColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        // Update color preview
        colorPreview.style.background = rgbaColor;

        // Update thumb color - ensure it updates every time
        updateSliderThumbColor(hexColor);

        // Prioritize HEX format display, but save RGBA format
        textInput.value = hexColor;

        // Update and apply settings
        settings[varId] = rgbaColor;
        applyThemeSetting(varId, rgbaColor);
        saveExtensionSettings(context);

        // Trigger custom event to notify color has changed
        document.dispatchEvent(new CustomEvent('colorChanged', {
            detail: { varId, value: rgbaColor, hexColor }
        }));
    }

    // Function to update color and alpha
    function updateColorAndAlpha() {
        const hexColor = colorInput.value;
        const alpha = alphaSlider.value / 100;

        // Get RGB part from HEX code
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Generate RGBA color string
        const rgbaColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        // Update color preview
        colorPreview.style.background = rgbaColor;

        // Ensure thumb color is updated
        updateSliderThumbColor(hexColor);

        // Update and apply settings
        settings[varId] = rgbaColor;
        applyThemeSetting(varId, rgbaColor);
        saveExtensionSettings(context);
    }

    // Assemble opacity control
    alphaRow.appendChild(alphaSlider);
    alphaRow.appendChild(alphaValue);
    alphaContainer.appendChild(alphaLabel);
    alphaContainer.appendChild(alphaRow);

    // Add to container
    colorPickerContainer.appendChild(colorPreview);
    colorPickerContainer.appendChild(textInput);
    colorPickerContainer.appendChild(alphaContainer);
    colorPickerContainer.appendChild(colorInput); // Add hidden color picker

    container.appendChild(colorPickerContainer);
}

/**
* Create slider setting item
* @param {HTMLElement} container - Setting container element
* @param {Object} setting - Setting configuration object
* @param {Object} settings - Current settings object
*/
function createSlider(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue, min, max, step } = setting;

    // Create slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.alignItems = 'center';
    sliderContainer.style.gap = '10px';
    sliderContainer.style.maxWidth = '480px';

    // Create slider
    const slider = document.createElement('input');
    slider.id = `cts-slider-${varId}`;
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = settings[varId] || defaultValue;
    slider.classList.add('moonlit-neo-range-input');
    slider.style.flex = '1';

    // Create number input
    const numberInput = document.createElement('input');
    numberInput.id = `cts-number-${varId}`;
    numberInput.type = 'number';
    numberInput.min = min;
    numberInput.max = max;
    numberInput.step = step;
    numberInput.value = settings[varId] || defaultValue;
    numberInput.classList.add('moonlit-neo-range-input');
    numberInput.style.width = '60px';

    // Slider change event
    slider.addEventListener('input', () => {
        // Update number input
        numberInput.value = slider.value;

        // Update settings
        settings[varId] = slider.value;

        // Apply settings
        applyThemeSetting(varId, slider.value);

        // Save settings
        saveExtensionSettings(context);
    });

    // Number input change event
    numberInput.addEventListener('change', () => {
        // Update slider
        slider.value = numberInput.value;

        // Update settings
        settings[varId] = numberInput.value;

        // Apply settings
        applyThemeSetting(varId, numberInput.value);

        // Save settings
        saveExtensionSettings(context);
    });

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(numberInput);
    container.appendChild(sliderContainer);
}

/**
 * Create dropdown menu setting item
 * @param {HTMLElement} container - Setting container element
 * @param {Object} setting - Setting configuration object
 * @param {Object} settings - Current settings object
 */
function createSelect(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue, options } = setting;

    // Create selector
    const select = document.createElement('select');
    select.id = `cts-${varId}`;
    select.classList.add('widthNatural', 'flex1', 'margin0', 'moonlit-select'); // Add exclusive class

    // Add options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        optionElement.selected = (settings[varId] || defaultValue) === option.value;
        select.appendChild(optionElement);
    });

    // Selector change event
    select.addEventListener('change', () => {
        // Update settings
        settings[varId] = select.value;

        // Apply settings
        applyThemeSetting(varId, select.value);

        // Save settings
        saveExtensionSettings(context);
    });

    container.appendChild(select);
}

/**
 * Create text input setting item
 * @param {HTMLElement} container - Setting container element
 * @param {Object} setting - Setting configuration object
 * @param {Object} settings - Current settings object
 */
function createTextInput(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue } = setting;

    // Create text input
    const input = document.createElement('input');
    input.id = `cts-${varId}`;
    input.type = 'text';
    input.value = settings[varId] || defaultValue;
    input.classList.add('text_pole', 'wide100p', 'widthNatural', 'flex1', 'margin0', 'moonlit-input'); // Add exclusive class

    // Text input change event
    input.addEventListener('change', () => {
        // Update settings
        settings[varId] = input.value;

        // Apply settings
        applyThemeSetting(varId, input.value);

        // Save settings
        saveExtensionSettings(context);
    });

    container.appendChild(input);
}
// Create textarea setting item (for raw CSS injection)
function createTextareaInput(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue } = setting;

    const textarea = document.createElement('textarea');
    textarea.id = `cts-${varId}`;
    textarea.classList.add('text_pole', 'margin0', 'margin-r5', 'textarea_compact', 'monospace');
    textarea.rows = 10; // sensible default
    textarea.spellcheck = false;
    textarea.value = (settings[varId] ?? defaultValue) || '';

    const apply = () => {
        settings[varId] = textarea.value;
        // Apply immediately (always active, regardless of theme enabled)
        if (varId === 'rawCustomCss') {
            applyRawCustomCss(settings[varId]);
        }
        saveExtensionSettings(context);
    };

    // Apply on change & input (input gives instant feedback)
    textarea.addEventListener('change', apply);
    textarea.addEventListener('input', apply);

    container.appendChild(textarea);
}


/**
 * Create checkbox setting item - Updated to check if extension is enabled
 * @param {HTMLElement} container - Setting container element
 * @param {Object} setting - Setting configuration object
 * @param {Object} settings - Current settings object
 */
function createCheckbox(container, setting, settings) {
    const context = SillyTavern.getContext();
    const { varId, default: defaultValue, displayText, cssBlock, cssFile, description } = setting;

    // Create checkbox container using flex layout
    const checkboxContainer = document.createElement('div');
    checkboxContainer.classList.add('checkbox-container');
    checkboxContainer.style.display = 'flex';
    checkboxContainer.style.flexDirection = 'column'; // Change to vertical arrangement
    checkboxContainer.style.marginTop = '8px';

    // Create horizontally arranged checkbox and label row
    const checkboxRow = document.createElement('div');
    checkboxRow.style.display = 'flex';
    checkboxRow.style.alignItems = 'center';

    // Create label FIRST
    const label = document.createElement('label');
    label.htmlFor = `cts-checkbox-${varId}`;
    label.textContent = displayText;
    label.style.marginRight = '8px';
    label.style.cursor = 'pointer';

    // Create checkbox AFTER label
    const checkbox = document.createElement('input');
    checkbox.id = `cts-checkbox-${varId}`;
    checkbox.type = 'checkbox';
    checkbox.checked = settings[varId] === true;
    checkbox.style.marginLeft = 'auto'; // Push to right side

    // Handle dynamic CSS stylesheet for checkbox
    let styleElement = document.getElementById(`css-block-${varId}`);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = `css-block-${varId}`;
        document.head.appendChild(styleElement);
    }

    // Function to update CSS stylesheet - inline CSS
    function updateInlineCssBlock(enabled) {
        // First check if extension is enabled
        if (!settings.enabled) {
            styleElement.textContent = ''; // Clear CSS if extension is disabled
            return;
        }

        if (styleElement && cssBlock) {
            styleElement.textContent = enabled ? cssBlock : '';
        }
    }

    // Function to load CSS from external file
    async function loadExternalCss(enabled) {
        // First check if extension is enabled
        if (!settings.enabled || !enabled || !cssFile) {
            // If extension disabled, checkbox disabled, or no file specified, clear styles
            if (styleElement) {
                styleElement.textContent = '';
            }
            return;
        }

        try {
            // Build full path for CSS file
            const cssFilePath = `${extensionFolderPath}/css/${cssFile}`;

            // Get CSS content
            const response = await fetch(cssFilePath);
            if (response.ok) {
                const cssText = await response.text();
                if (styleElement) {
                    styleElement.textContent = cssText;
                }
            } else {
                // Error handled silently
            }
        } catch (error) {
            // Error handled silently
        }
    }

    // Main function to apply CSS
    async function applyCss(enabled) {
        if (cssFile) {
            // If external file specified, prioritize using external file
            await loadExternalCss(enabled);
        } else if (cssBlock) {
            // Otherwise use inline CSS block
            updateInlineCssBlock(enabled);
        }
    }

    // Initial CSS application - now checks if extension is enabled
    applyCss(checkbox.checked);

    // Checkbox change event
    checkbox.addEventListener('change', () => {
        // Update settings
        settings[varId] = checkbox.checked;

        // Apply or remove CSS
        applyCss(checkbox.checked);

        // Apply settings
        applyThemeSetting(varId, checkbox.checked ? 'true' : 'false');

        // Save settings
        saveExtensionSettings(context);
    });

    // Add to row container in the order: label first, then checkbox
    checkboxRow.appendChild(label);
    checkboxRow.appendChild(checkbox);

    // Add row container to main container
    checkboxContainer.appendChild(checkboxRow);

    // If there is a description, create and add description element
    if (description) {
        const descriptionElement = document.createElement('small');
        descriptionElement.textContent = description;
        descriptionElement.style.marginLeft = '0'; // No indentation needed
        descriptionElement.style.marginTop = '4px';
        descriptionElement.style.opacity = '0.7';
        descriptionElement.style.fontSize = '0.85em';
        checkboxContainer.appendChild(descriptionElement);
    }

    // Add to container
    container.appendChild(checkboxContainer);
}

/**
 * Initialize chat appearance switcher - only when theme is enabled
 * Handle switching between different chat styles
 */
function initChatDisplaySwitcher() {
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    const themeSelect = document.getElementById("themes");
    const chatDisplaySelect = document.getElementById("chat_display");
    if (!themeSelect || !chatDisplaySelect) return;

    // Add our custom options exactly once (regardless of theme enabled)
    function addCustomStyleOptions() {
        if (customChatStylesAdded) return;

        const ensureOption = (value, label) => {
            if (!chatDisplaySelect.querySelector(`option[value="${value}"]`)) {
                const opt = document.createElement("option");
                opt.value = value;
                opt.text = label;
                chatDisplaySelect.appendChild(opt);
            }
        };

        // Ensure all custom styles exist
        ensureOption("3", t`Echo`);
        ensureOption("4", t`Whisper`);
        ensureOption("5", t`Hush`);
        ensureOption("6", t`Ripple`);
        ensureOption("7", t`Tide`);

        customChatStylesAdded = true;
    }

    // Apply the selected chat style by toggling body classes
    function applyChatDisplayStyle() {
        document.body.classList.remove(
            "flatchat","bubblechat","documentstyle",
            "echostyle","whisperstyle","hushstyle",
            "ripplestyle","tidestyle"
        );

        switch (chatDisplaySelect.value) {
            case "0": document.body.classList.add("flatchat"); break;
            case "1": document.body.classList.add("bubblechat"); break;
            case "2": document.body.classList.add("documentstyle"); break;
            case "3": document.body.classList.add("echostyle"); break;
            case "4": document.body.classList.add("whisperstyle"); break;
            case "5": document.body.classList.add("hushstyle"); break;
            case "6": document.body.classList.add("ripplestyle"); break;
            case "7": document.body.classList.add("tidestyle"); break;
        }
    }

    // Always add our options
    addCustomStyleOptions();

    // Restore saved selections
    const savedTheme = localStorage.getItem("savedTheme");
    const savedChatStyle = localStorage.getItem("savedChatStyle");
    if (savedTheme) themeSelect.value = savedTheme;
    if (savedChatStyle) chatDisplaySelect.value = savedChatStyle;

    // Events
    themeSelect.addEventListener("change", function() {
        localStorage.setItem("savedTheme", themeSelect.value);
        applyChatDisplayStyle();
    });

    chatDisplaySelect.addEventListener("change", function() {
        localStorage.setItem("savedChatStyle", chatDisplaySelect.value);
        applyChatDisplayStyle();
    });

    applyChatDisplayStyle();
}


/**
* Apply single theme setting
* @param {string} varId - CSS variable ID
* @param {string} value - Setting value
*/
function applyThemeSetting(varId, value) {
    // Directly set CSS variable
    document.documentElement.style.setProperty(`--${varId}`, value, 'important');

    // Trigger custom event
    document.dispatchEvent(new CustomEvent('themeSettingChanged', {
        detail: { varId, value }
    }));
}
// Inject raw CSS (unfiltered) into the page via a dedicated <style> tag
function applyRawCustomCss(cssText) {
    let rawStyle = document.getElementById('moonlit-raw-css');
    if (!rawStyle) {
        rawStyle = document.createElement('style');
        rawStyle.id = 'moonlit-raw-css';
        // DO NOT sanitize or filter; user explicitly wants full control
        document.head.appendChild(rawStyle);
    }
    rawStyle.textContent = cssText || '';
}
// Re-apply when the setting changes (optional safety net)
document.addEventListener('themeSettingChanged', (ev) => {
    const { varId, value } = ev.detail || {};
    if (varId === 'rawCustomCss') {
        applyRawCustomCss(value);
    }
});

/**
 * Convert RGBA to HEX - enhanced version
 * Support more formats and better error handling
 * @param {string} rgba - RGBA color string
 * @returns {string|null} HEX color string or null
 */


/**
* Dynamically add a new custom setting
* Use this function to add new settings at runtime
* @param {Object} settingConfig - Setting configuration object
*/
function addCustomSetting(settingConfig) {
    // Check setting validity
    if (!settingConfig || !settingConfig.varId || !settingConfig.type) {
        return;
    }

    // Check if already exists
    const existing = themeCustomSettings.find(s => s.varId === settingConfig.varId);
    if (existing) {
        return;
    }

    // Add to setting configuration
    themeCustomSettings.push(settingConfig);

    // Get settings and add default value
    const context = SillyTavern.getContext();
    const settings = getExtensionSettings(context);

    // If settings don't have this item, add default value
    if (settings[settingConfig.varId] === undefined) {
        settings[settingConfig.varId] = settingConfig.default;
    }

    // Save settings
    saveExtensionSettings(context);

    // Re-render settings panel
    const settingsContainer = document.querySelector(`#${settingsKey}-drawer .inline-drawer-content`);
    if (settingsContainer) {
        // Clear existing settings (keep enable switch)
        const enabledCheckbox = settingsContainer.querySelector(`#${settingsKey}-enabled`).parentElement;
        const separator = settingsContainer.querySelector('hr');

        // Clear child elements
        while (settingsContainer.lastChild) {
            settingsContainer.removeChild(settingsContainer.lastChild);
        }

        // Re-add enable switch
        settingsContainer.appendChild(enabledCheckbox);
        settingsContainer.appendChild(separator);

        // Recreate settings
        createCustomSettingsUI(settingsContainer, settings);
    }
}


// Public API
window.MoonlitEchoesTheme = {
    // Initialization function
    init: function() {
        applyAllThemeSettings();
        initializeThemeColorOnDemand();
        syncMoonlitPresetsWithThemeList();
    },

    // Add new setting
    addSetting: addCustomSetting,

    // Apply setting
    applySetting: applyThemeSetting,

    // Get all settings
    getSettings: function() {
        return getExtensionSettings();
    },

    // Get setting configuration
    getSettingsConfig: function() {
        return [...themeCustomSettings];
    },

    // Preset management
    presets: {
        // Get all presets
        getAll: function() {
            const context = SillyTavern.getContext();
            const settings = getExtensionSettings(context);
            return settings?.presets || {};
        },

        // Get current active preset
        getActive: function() {
            const context = SillyTavern.getContext();
            const settings = getExtensionSettings(context);
            return {
                name: settings.activePreset,
                settings: settings.presets[settings.activePreset] || {}
            };
        },

        // Create new preset
        create: function(name, settingsObj) {
            const context = SillyTavern.getContext();
            const settings = getExtensionSettings(context);

            // Check if name is valid
            if (!name || typeof name !== 'string') {
                return false;
            }

            // Create new preset
            settings.presets[name] = settingsObj || {};

            // Save settings
            saveExtensionSettings(context);

            // Update theme selector
            syncMoonlitPresetsWithThemeList();

            return true;
        },

        // Load preset
        load: function(name) {
            return loadPreset(name);
        },

        // Update existing preset
        update: function(name, settingsObj) {
            const context = SillyTavern.getContext();
            const settings = getExtensionSettings(context);

            // Check if preset exists
            if (!settings.presets[name]) {
                return false;
            }

            // Update preset
            settings.presets[name] = settingsObj || settings.presets[name];

            // Save settings
            saveExtensionSettings(context);

            return true;
        },

        // Delete preset
        delete: function(name) {
            const context = SillyTavern.getContext();
            const settings = getExtensionSettings(context);

            // Check if it's the Default preset
            if (name === 'Default') {
                return false;
            }

            // Check if preset exists
            if (!settings.presets[name]) {
                return false;
            }

            // Check if it's the last preset
            if (Object.keys(settings.presets).length <= 1) {
                return false;
            }

            // If deleting current active preset, switch to Default
            if (settings.activePreset === name) {
                settings.activePreset = 'Default';
                applyPresetToSettings('Default');
            }

            // Delete preset
            delete settings.presets[name];

            // Save settings
            saveExtensionSettings(context);

            // Update theme selector
            syncMoonlitPresetsWithThemeList();

            return true;
        },

        // Export preset as JSON
        export: function(name) {
            const context = SillyTavern.getContext();
            const settings = getExtensionSettings(context);

            // Check if preset exists
            if (!settings.presets[name]) {
                return null;
            }

            // Create export object
            return {
                moonlitEchoesPreset: true,
                presetVersion: THEME_VERSION,
                presetName: name,
                settings: settings.presets[name]
            };
        },

        // Import preset
        import: function(jsonData) {
            // Check format
            if (!jsonData || !jsonData.moonlitEchoesPreset || !jsonData.presetName || !jsonData.settings) {
                return false;
            }

            const context = SillyTavern.getContext();
            const settings = getExtensionSettings(context);

            // Get preset name
            const presetName = jsonData.presetName;

            // Create/update preset
            settings.presets[presetName] = jsonData.settings;

            // Save settings
            saveExtensionSettings(context);

            // Update theme selector
            syncMoonlitPresetsWithThemeList();

            return true;
        }
    }
};

// Expose initialization function for external call
window.initializeThemeColorOnDemand = function() {
    applyAllThemeSettings();
    syncMoonlitPresetsWithThemeList();
};

// Ensure modern compact styles are added after page load
document.addEventListener('DOMContentLoaded', function() {
    // Add modern compact styles at the appropriate time
    addModernCompactStyles();

    // Sync Moonlit presets with theme list
    syncMoonlitPresetsWithThemeList();
});

// Opacity slider color update
function updateColorSliderThumb(varId, hexColor) {
    const alphaSlider = document.querySelector(`#cts-${varId}-alpha`);
    if (!alphaSlider) return;

    // Find or create style element for this slider
    let styleElement = document.getElementById(`thumb-style-${varId}`);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = `thumb-style-${varId}`;
        document.head.appendChild(styleElement);
    }

    // Create new thumb style
    const newThumbStyle = `
        #cts-${varId}-alpha::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${hexColor};
            border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }
        #cts-${varId}-alpha::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${hexColor};
            border: 1px solid color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        }
    `;

    // Update style
    styleElement.textContent = newThumbStyle;
}
document.addEventListener('colorChanged', function(event) {
    const { varId, hexColor } = event.detail;
    // Update corresponding color slider
    updateColorSliderThumb(varId, hexColor);
});

window.formSheldHeightController = initFormSheldHeightMonitor();
