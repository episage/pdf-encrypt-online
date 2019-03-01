require('dotenv').config();

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const uuidv4 = require('uuid/v4');
var filename = require('file-name');
const { execFile } = require('child_process');
var glob = require("glob")

const path = require('path')

const PORT = parseInt(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';
const PATH_TO_RUBY_ORIGAMI_GEM_PDFENCRYPT = process.env.PATH_TO_RUBY_ORIGAMI_GEM_PDFENCRYPT;
// default options
app.use(fileUpload());

app.use(express.static('public'))

app.post('/upload', function (req, res) {
    var pdfFile = req.files.pdf;
    var password = req.body.password;

    if (!pdfFile) {
        var message = 'nie załączyłeś pliku';
        console.error(message);
        return res.status(400).send(message);
    }
    if (!password) {
        var message = 'nie nadałeś pliku';
        console.error(message);
        return res.status(400).send(message);
    }

    var tempFile = TempFile(pdfFile.name, DATA_DIR, '.encrypted', '.pdf');

    pdfFile.mv(tempFile.tempPath, async function (error) {
        if (error) {
            console.error(error);
            return res.status(500).send(error);
        }

        resolveFilePath(PATH_TO_RUBY_ORIGAMI_GEM_PDFENCRYPT, (error, execFilePath) => { // not sure if necessary
            if (error) {
                console.error(error);
                return res.status(500).send(error);
            }

            execFile(execFilePath, [tempFile.tempPath, '-p', password, '-o', tempFile.tempConvertedPath], (error, stdout, stderr) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send(error);
                }

                return res.download(tempFile.tempConvertedPath, tempFile.convertedName);
            });
        })
    });
});
app.get('/upload', (req, res) => {
    return res.redirect('/');
})

app.listen(PORT, () => console.log(`App is listening on port ${PORT}!`))


function TempFile(originalName, storageDirectory, convertedNameSuffix, extension = '') {
    var tempName = uuidv4();
    var tempNameExt = tempName + extension;
    var tempPath = path.join(storageDirectory, tempNameExt);
    var tempConvertedPath = path.join(storageDirectory, tempName + convertedNameSuffix + extension);
    var convertedName = filename(originalName) + convertedNameSuffix + extension;

    return {
        originalName,
        tempName,
        tempPath,
        tempConvertedPath,
        convertedName,
    }
}

function resolveFilePath(filePath, callback) {
    glob(filePath, function (error, files) {
        if (error) {
            return callback(error);
        }

        if (files.length <= 0) {
            return callback('no files found for glob ' + filePath);
        }

        return callback(null, files[0]);
    })
}