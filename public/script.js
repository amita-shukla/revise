document.addEventListener('DOMContentLoaded', function() {
    const refreshButton = document.getElementById('refresh');
    refreshButton.addEventListener('click', () => {
        fetch('refresh-data')
            .then(res => res.json())
            .then(data => {
                if (data.message === 'Data refreshed successfully') {
                    window.location.reload();
                    alert('Data updated successfully!');
                } else {
                    alert('Failed to update data');
                }
            })
            .catch(error => console.error(`error: ${error}`));
    });


    const dropdown = document.getElementById('category');
    const qa = document.getElementById('qa');
    qa.classList.add('hidden');

    // Add a default option to the dropdown
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Category';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);

    fetch('/content/data.json')
        .then(response => response.json())
        .then(data => {
            const lastUpdated = data.lastUpdated;
            const label = document.getElementById('last-updated');
            label.textContent = `Last updated on: ${lastUpdated}`;

            const categories = data.categories_list;

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value =  category;
                option.textContent = category;
                dropdown.appendChild(option);
            });

            dropdown.addEventListener('change', () => {
                qa.classList.remove('hidden');
                const selectedCategory = dropdown.value;
                console.log(`selected category: ${selectedCategory}`)
                let index = 0;
                console.log(data);
                const size = data.categories[selectedCategory].length;
                let shuffle = [...Array(size).keys()];

                const updateQA = async (index, shuffle) => {
                    console.log('shuffle: ' + shuffle)
                    console.log('current index is: ' + index);
                    
                    qa.innerHTML = '';
                    const selectedData = data.categories[selectedCategory][index];

                    displayNavButtons(index, size, shuffle);

                    const questionContent = document.createElement('div');
                    questionContent.textContent = selectedData.question;
                    questionContent.classList.add('question');
                    qa.appendChild(questionContent);

                    const revealButton = document.createElement('button');
                    revealButton.textContent = 'Reveal Answer';
                    qa.appendChild(revealButton);

                    const answerContent = document.createElement('div');
                    answerContent.textContent = selectedData.answer;
                    answerContent.classList.add('hidden');
                    qa.appendChild(answerContent);

                    const imgsrc = selectedData.pic;
                    const isValid = isValidURL(imgsrc);
                    if(imgsrc && isValid) {
                        const isValidImage = await validateImageURL(imgsrc);
                        if(isValidImage) { 
                            const picContainer = document.createElement('div');
                            picContainer.classList.add('pic-container');
                            picContainer.classList.add('hidden');

                            const imgElement = document.createElement('img');
                            imgElement.src = imgsrc;
                            imgElement.alt = 'Diagram for the answer';
                            picContainer.appendChild(imgElement);

                            qa.appendChild(picContainer);

                            addRevealButtonListener(revealButton, answerContent, picContainer);
                        } else {
                            addRevealButtonListener(revealButton, answerContent)
                        }
                    } else {
                        addRevealButtonListener(revealButton, answerContent)
                    }
                };

                const addRevealButtonListener = (button, answer, pic) => {
                    button.addEventListener('click', () => {
                        answer.classList.remove('hidden');
                        if(pic) pic.classList.remove('hidden');
                        button.classList.add('hidden');
                    });
                }

                const validateImageURL = async (url) => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(true);
                        img.onerror = () => resolve(false);
                        img.src = url;
                    });
                };

                const isValidURL = (string) => {
                    try {
                        new URL(string);
                        return true;
                    } catch(_) {
                        console.log('invalid url: ' + string);
                        return false;
                    }
                }

                const displayNavButtons = (index, size, shuffle) => {
                    const navButtonsContainer = document.createElement('div');
                    navButtonsContainer.classList.add('nav-buttons');
                    qa.appendChild(navButtonsContainer);

                    const nextButton = document.createElement('button');
                    nextButton.textContent = 'Next';
                    nextButton.classList.add('nav-button');
                    navButtonsContainer.appendChild(nextButton);

                    const prevButton = document.createElement('button');
                    prevButton.textContent = 'Previous';
                    prevButton.classList.add('nav-button');
                    navButtonsContainer.appendChild(prevButton);

                    const randomButton = document.createElement('button');
                    randomButton.textContent = 'Random';
                    randomButton.classList.add('nav-button');
                    navButtonsContainer.appendChild(randomButton);

                    nextButton.addEventListener('click', () => {
                        index = (index >= size - 1) ? 0 : index+1;
                        updateQA(index, shuffle);
                    });

                    prevButton.addEventListener('click', () => {
                        index = (index > 0) ? index-1 : size -1;
                        updateQA(index, shuffle);
                    });

                    randomButton.addEventListener('click', () => {
                        if(shuffle.length == 0) {
                            shuffle = [...Array(size).keys()];
                        }
                        let min = 0, max = shuffle.length-1;
                        randomIndex = Math.floor(Math.random() * (max-min+1)) + min;
                        index = shuffle.splice(randomIndex, 1)[0];
                        updateQA(index, shuffle);
                    });
                };

                updateQA(index, shuffle);
            });
        })
        .catch(error => {
            console.error('Error fetching json data: ', error);
        });
})

/*
function pageload() {
    load_categories();
}

function load() {
    // read excel files, return a list of categories
    // var data = require('content/data.json');
    const {data} = file;
    console.log(file);
    return data;
}

function load_categories() {
    var cats = categories();
    for(i=0; i<cats.length; i++){
        document.container.category.options[i] = new Option(categories[i], i);
    }
}

function print_data_sample() {

}

function categories() {
    var data = load();
    return data.categories_list;
}

function next(cat, id) {
    var size = data.categories[cat].length;
    return id+1==size? 0 : id+1;
}

function previous(cat, id) {
    var size = data.categories[cat].length;
    return id-1==0 ? size-1 : id-1;
}

function randomise(cat) {
    var max = data.categories[cat].length, min = 0;
    return Math.random * (max-min) + min;
}
*/