const express = require('express');
const path =  require('path');
const { generateJson } = require('./googlesheettojson');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// serve static files from public dir
app.use(express.static(path.join(__dirname, 'public')));

// serve json file from content dir
app.use('/content', express.static(path.join(__dirname, 'content')));

// route to serve html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.get('/refresh-data', (req, res) => {
    exec('node googlesheettojson.js', (error, stdout, stderr) => {
        if(error) {
            console.error(`Error refreshing data: ${error}`);
            return res.status(500).json({ message: 'Error refreshing data' });
        }
        console.log(`data refresh output: ${stdout}`);
        res.status(200).json({ message: 'Data refreshed successfully' });
    });
})

generateJson().then(() => {
    console.log(`google sheets data fetched and saved`);
}).catch(err => {
    console.error(`error generating json: ${err}`);
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

