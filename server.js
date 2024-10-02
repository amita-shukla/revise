const express = require('express');
const path =  require('path');
const { generateJson } = require('./googlesheettojson');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// serve static files from public dir
app.use(express.static(path.join(__dirname, 'public')));

// serve json file from content dir
// app.use('/content', express.static(path.join(__dirname, 'content')));

// route to serve html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.get('/refresh-data', async (req, res) => {
    try {
        const jsonData = await generateJson(true);

        if(jsonData.status == 200){
            console.log('data refreshed successfully');
            res.status(200).json(jsonData);
        } else {
            console.error(`error refreshing data: ${jsonData.message}`);
            res.status(500).json({message: jsonData.message});
        }
    } catch (error) {
        console.error(`error refreshing data, ${error}`);
        res.status(500).json({mesage: 'error refreshing data'});
    }
})

// generateJson(true).then(() => {
//     console.log(`google sheets data fetched and saved`);
// }).catch(err => {
//     console.error(`error generating json: ${err}`);
// })

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

