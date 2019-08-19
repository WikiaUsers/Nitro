/**
 * main.js
 *
 * Launcher for the web process
 */
'use strict';

/**
 * Importing modules
 */
const {app, BrowserWindow} = require('electron');
let mainWindow;

/**
 * Creates the browser window and initializes Electron
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        height: 900,
        webPreferences: {
            nodeIntegration: true
        },
        width: 1200
    });
    mainWindow.maximize();
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

/**
 * Electron has finished initialization and is ready to create
 * browser windows. Some APIs can only be used after this event occurs.
 */
app.on('ready', createWindow);

/**
 * Quit when all windows are closed.
 */
app.on('window-all-closed', function() {
    /**
     * On OS X it is common for applications and their menu bar
     * to stay active until the user quits explicitly with Cmd + Q
     */
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    /**
     * On OS X it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
     */
    if (mainWindow === null) {
        createWindow();
    }
});
