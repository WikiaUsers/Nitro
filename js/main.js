const Jimp = require('jimp'),
      // TODO: Those are workarounds until uploading through XMLHttpRequest starts working
      http = require('request-promise-native'),
      jar  = http.jar(),
      fs   = require('fs');
let userId, loginForm, uploadForm, spinner, avatarFile;

function request(url, method, data, form) {
    return new Promise(function(resolve, reject) {
        if (!form && typeof data === 'object') {
            const arr = [];
            for (let i in data) {
                arr.push(`${encodeURIComponent(i)}=${encodeURIComponent(data[i])}`);
            }
            if (arr.length) {
                url += `?${arr.join('&')}`;
            }
        }
        const xhr = new XMLHttpRequest();
        xhr.open(method, `https://services.wikia.com/${url}`, true);
        xhr.responseType = 'json';
        xhr.addEventListener('loadend', function() {
            if (this.status === 200) {
                resolve(this.response);
            } else {
                reject(this.status, this.response);
            }
        });
        xhr.upload.addEventListener('progress', cbProgress);
        xhr.send(form ? data : null);
    });
}

function showSpinner() {
    spinner.classList.remove('hidden');
}

function hideSpinner() {
    spinner.classList.add('hidden');
}

function id(i) {
    return document.getElementById(i);
}

function onload() {
    loginForm = id('login');
    uploadForm = id('upload');
    spinner = id('spinner');
    loginForm.submit.addEventListener('click', login);
    uploadForm.upload.addEventListener('change', setupUpload);
    uploadForm.submit.addEventListener('click', upload);
    request('whoami', 'GET').then(whoami).catch(errWhoami);
}

function whoami(d) {
    userId = Number(d.userId);
    setUpload();
}

function errWhoami(status, e) {
    console.log(status, e);
}

function login(e) {
    e.preventDefault();
    showSpinner();
    console.log(e);
    const fd = new FormData(loginForm);
    request('auth/token', 'POST', {
        username: fd.get('username'),
        password: fd.get('password')
    }).then(cbLogin).catch(errLogin);
}

function cbLogin(d) {
    hideSpinner();
    userId = Number(d.user_id);
    const date = new Date();
    date.setFullYear(date.getFullYear() + 10);
    jar.setCookie(http.cookie(
        `access_token=${d.access_token}; Expires=${date.toGMTString()}; Domain=wikia.com; Path=/; HttpOnly; hostOnly=false;`
    ), 'http://wikia.com');
    // TODO: Set document.cookie?
    setUpload();
}

function errLogin() {
    hideSpinner();
    console.log('Error');
}

function setUpload() {
    [loginForm.username, loginForm.password, loginForm.submit]
        .forEach(el => el.disabled = true);
    uploadForm.upload.disabled = false;
}

function setupUpload() {
    avatarFile = this.files[0];
    console.log(avatarFile);
    uploadForm.submit.disabled = !Boolean(avatarFile);
}

function upload(e) {
    e.preventDefault();
    if (avatarFile) {
        const req = http({
            method: 'PUT',
            uri: `https://services.wikia.com/user-avatar/user/${userId}/avatar`,
            jar: jar,
            json: true
        });
        req.form().append('file', fs.createReadStream(avatarFile.path));
        req.then(cbUpload).catch(errUpload);
        showSpinner();
    }
}

function cbUpload(d) {
    hideSpinner();
    console.log(d);
}

function cbProgress(e) {
    if (e.lengthComputable) {
        console.log(e.loaded / e.total * 100);
    }
}

function errUpload(status, error) {
    hideSpinner();
    console.log(status, error);
}

window.addEventListener('load', onload);
