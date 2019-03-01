require('dotenv').config();

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const uuidv4 = require('uuid/v4');
var filename = require('file-name');
const { child_process } = require('child_process');


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

    var tempFile = TempFile(pdfFile.name, DATA_DIR, '_enc', '.pdf');

    pdfFile.mv(tempFile.tempPath, async function (error) {
        if (error) {
            console.error(error);
            return res.status(500).send(error);
        }

        child_process.execFile(path.join(PATH_TO_RUBY_ORIGAMI_GEM_PDFENCRYPT), [tempFile.tempPath, '-p', password, '-o', tempFile.tempConvertedPath], (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                return res.status(500).send(error);
            }

            return res.download(tempFile.tempConvertedPath, tempFile.convertedName);
        });
    });
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))


function TempFile(originalName, storageDirectory, convertedNameSuffix, extension = '') {
    var tempName = uuidv4() + extension;
    var tempPath = path.join(storageDirectory, tempName);
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