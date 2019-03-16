/**
 * main.js
 *
 * Main JS file of Nitro
 */
'use strict';

/**
 * Importing modules
 */
const http = require('request-promise-native'),
      fs = require('fs'),
      {app, dialog} = require('electron').remote,
      pkg = require('./package.json'),
      langs = require('./i18n/_list.json');

/**
 * Constants
 */
const jar = http.jar(),
      statuses = {};

/**
 * Variables
 */
let userId, loginForm, uploadForm, spinner, avatarFile, uploading, avatarSize,
    progress, i18n, autoLogin = true;

/**
 * Sends an HTTP request to Service API
 * @param {String} path Path to request
 * @param {String} method HTTP method to use
 * @param {Object} form Form data to send
 * @returns {Promise} Promise to listen on for response
 */
function request(path, method, form) {
    return http({
        form,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': `${pkg.name} v${pkg.version}: GIF avatars for everyone!`
        },
        jar,
        json: !form,
        method,
        uri: `https://services.fandom.com/${path}`
    });
}

/**
 * Shows the WDS spinner
 */
function showSpinner() {
    spinner.classList.remove('hidden');
    progress.textContent = '';
}

/**
 * Hides the WDS spinner
 */
function hideSpinner() {
    spinner.classList.add('hidden');
}

/**
 * Shorthand function for getting an element based on its ID
 * @param {String} i ID of the element
 * @returns {Node} Element with the given ID
 */
function id(i) {
    return document.getElementById(i);
}

/**
 * Puts an notice below a form
 * @param {String} form Form below which to put the notice
 * @param {String} status "error" or "success" notice type
 * @param {String} text I18n key of the string to put
 */
function notice(form, status, text) {
    statuses[form][
        status === 'success' ? 'error' : 'success'
    ].textContent = '';
    statuses[form][status].textContent = i18n[text];
}

/**
 * Switches to upload mode
 */
function setUpload() {
    ['username', 'password'].forEach(function(el) {
        loginForm[el].disabled = true;
    });
    loginForm.submit.value = i18n.logout;
    uploadForm.select.disabled = false;
}

/**
 * Callback after finding user's ID through the Service API
 * @param {Object} d Data returned by the Service API
 */
function cbWhoami(d) {
    userId = Number(d.userId);
    if (autoLogin) {
        notice('login', 'success', 'login-auto');
    }
    setUpload();
}

/**
 * Callback after finding user's ID failed
 * @param {Error} error HTTP error that occurred
 */
function errWhoami(error) {
    if (error.statusCode !== 401) {
        // Unknwon error
        console.error(error);
    }
}

/**
 * Sets the access_token cookie
 * @param {String} token Access token to set
 */
function setCookie(token) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 10);
    jar.setCookie(http.cookie(
        `access_token=${token}; Expires=${date.toGMTString()}; Domain=fandom.com; Path=/; HttpOnly; hostOnly=false;`
    ), 'https://fandom.com');
}

/**
 * Callback after logging in
 * @param {String} d Login API response
 */
function cbLogin(d) {
    const data = JSON.parse(d);
    hideSpinner();
    userId = Number(data.user_id);
    setCookie(data.access_token);
    localStorage.setItem('token', data.access_token);
    notice('login', 'success', 'login-success');
    setUpload();
}

/**
 * Callback after logging in failed
 * @param {Error} error HTTP error that occurred
 */
function errLogin(error) {
    hideSpinner();
    if (error.statusCode === 401) {
        notice('login', 'error', 'login-badpass');
    } else {
        notice('login', 'error', 'login-unknown');
    }
}

/**
 * Logs the user in
 * @param {Event} e DOM event that triggered the login
 */
function login(e) {
    e.preventDefault();
    autoLogin = false;
    if (userId) {
        localStorage.removeItem('token');
        window.location.reload();
    } else {
        showSpinner();
        const fd = new FormData(loginForm);
        request('auth/token', 'POST', {
            password: fd.get('password'),
            username: fd.get('username')
        }).then(cbLogin).catch(errLogin);
    }
}

/**
 * Callback after finding avatar's file size
 * @param {Error} err Error that occurred
 * @param {Number} size Size of the file
 */
function cbLstat(err, {size}) {
    if (err) {
        notice('upload', 'error', 'upload-lstat');
        console.error(err);
    } else {
        avatarSize = size;
        uploadForm.submit.disabled = false;
    }
}

/**
 * Shows the upload file dialog
 * @param {Event} e DOM event that triggered enabling of the upload
 */
function setupUpload(e) {
    e.preventDefault();
    const files = dialog.showOpenDialog({
        filters: [{
            extensions: ['gif'],
            name: i18n.filetype
        }]
    });
    if (files) {
        avatarFile = files[0];
        fs.lstat(avatarFile, cbLstat);
    } else {
        uploadForm.submit.disabled = true;
    }
}

/**
 * Callback after uploading the avatar
 * @param {Object} d Data returned by the upload API
 */
function cbUpload(d) {
    hideSpinner();
    notice('upload', 'success', 'upload-success');
    console.info(d);
}

/**
 * Callback after the upload progresses
 */
function cbProgress() {
    progress.textContent = `${Math.round(
        uploading.req.connection.bytesWritten / avatarSize * 100
    )}%`;
}

/**
 * Callback after the upload fails
 * @param {Error} error HTTP error that occurred
 */
function errUpload(error) {
    hideSpinner();
    if (error.statusCode === 400) {
        notice('upload', 'error', 'upload-badsize');
    } else {
        notice('upload', 'error', 'upload-unknown');
    }
    console.error(error);
}

/**
 * Uploads the avatar
 * @param {Event} e DOM event that triggered the upload
 */
function upload(e) {
    e.preventDefault();
    if (avatarFile) {
        uploading = request(`user-avatar/user/${userId}/avatar`, 'PUT');
        uploading.form().append('file', fs.createReadStream(avatarFile));
        uploading.on('drain', cbProgress);
        uploading.then(cbUpload).catch(errUpload);
        showSpinner();
    }
}

/**
 * Sets the user's language and updates messages
 * @param {String} lang Language to set
 */
function setLanguage(lang) {
    localStorage.setItem('lang', lang);
    try {
        i18n = require(`./i18n/${lang}.json`);
    } catch (e) {
        i18n = require('./i18n/en.json');
    }
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(function(n) {
        const key = n.dataset.i18n,
              val = i18n[key] || `<${key}>`;
        if (n.nodeName === 'INPUT') {
            if (n.type === 'submit') {
                n.value = val;
            } else {
                n.placeholder = val;
            }
        } else {
            n.textContent = val;
        }
    });
}

/**
 * Event called after a language has been selected
 * @param {ClickEvent} e DOM event that triggered the switch
 */
function selectLang(e) {
    setLanguage(e.target.dataset.lang);
}

/**
 * Sets up the DOM elements
 */
function setupDOM() {
    loginForm = id('login');
    uploadForm = id('upload');
    spinner = id('spinner');
    progress = id('progress');
    loginForm.submit.addEventListener('click', login);
    uploadForm.submit.addEventListener('click', upload);
    uploadForm.select.addEventListener('click', setupUpload);
    ['login', 'upload'].forEach(function(t) {
        statuses[t] = {};
        ['error', 'success'].forEach(function(t1) {
            statuses[t][t1] = id(`${t}-${t1}`);
        });
    });
}

/**
 * Sets up the current language
 */
function setupLanguage() {
    const arr = app.getLocale().split('-');
    arr.pop();
    setLanguage(localStorage.getItem('lang') || arr.join('-'));
}

/**
 * Sets up the language list
 */
function setupList() {
    const list = document.querySelector('#language > #list > ul');
    for (const i in langs) {
        const node = document.createElement('li');
        node.dataset.lang = i;
        node.textContent = langs[i];
        node.addEventListener('click', selectLang);
        list.appendChild(node);
    }
}

/**
 * Sets up the token and continues to find user's ID
 */
function setupToken() {
    const token = localStorage.getItem('token');
    if (token) {
        setCookie(token);
    }
    request('whoami', 'GET').then(cbWhoami).catch(errWhoami);
}

/**
 * Callback after the document loads
 */
function onload() {
    setupDOM();
    setupLanguage();
    setupList();
    setupToken();
}

window.addEventListener('load', onload);
