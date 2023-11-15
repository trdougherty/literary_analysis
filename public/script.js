// Define the margins of the chart
const margin = { top: 15, right: 50, bottom: 120, left: 30 };
let svg; // Declare svg here to make it accessible in the global scope
let width, height; // Declare width and height here for global access
let timeoutId;

let xScale, yScale; // Declare xScale and yScale here for global access

let step = parseInt(localStorage.getItem('onboardingStep')) || 1;
console.log("step:", step);

function highlightElement(element) {
    const overlay = document.getElementById('highlightOverlay');
    const rect = element.getBoundingClientRect();
    const buffer = 10; // 10px buffer, adjust as needed

    overlay.style.display = 'block'; // Show the overlay
    overlay.style.width = `${rect.width + buffer * 2}px`; // Add buffer to width
    overlay.style.height = `${rect.height + buffer * 2}px`; // Add buffer to height
    overlay.style.top = `${rect.top + window.scrollY - buffer}px`; // Position above the element with buffer
    overlay.style.left = `${rect.left + window.scrollX - buffer}px`; // Position left of the element with buffer
}

function positionPopup(position) {
    const popup = document.querySelector('.popup');
    popup.style.top = position.top;
    popup.style.left = position.left;
}

// Define the content for each step
const steps = [
    { 
        title: 'Peaks and Valleys of Literary Emotion', 
        content: 'This small project is meant to help highlight the ebbs and flows of emotions through great books. I hope you enjoy it! First, how to use the system...', 
        selector: '.nextButton', // Selects the div with class 'controls'
        position: { top: '50vh', left: '40vw' } // Example of using viewport units
    },
    { 
        title: 'Control Panel', 
        content: 'This section is the main way you can interact with this system.', 
        selector: '.controls', // Selects the div with class 'controls'
        position: { top: '50vh', left: '70vw' } // Example of using viewport units
    },
    { 
        title: 'Book Selection', 
        content: 'The dropdown menu here has some precomputed books available for analysis.', 
        selector: '#dataset', // Selects the element with id 'dataset'
        position: { top: '30vh', left: '70vw' } // Example of using viewport units
    },
    { 
        title: 'Concept Selection', 
        content: 'By selecting a concept, the graph will update to show you the progression of the concept through the book.', 
        selector: '#term', // Selects the element with id 'term'
        position: { top: '50vh', left: '70vw' } // Example of using viewport units
    },
    { 
        title: 'Moving Average', 
        content: 'The dark line on the graph represents a moving average of emotion in the surrounding sections. By increasing or decreasing this slider, you can zoom in on local trends or smooth out macroscopic patterns.', 
        selector: '#mySlider', // Selects the element with id 'mySlider'
        position: { top: '50vh', left: '70vw' } // Example of using viewport units
    },
    { 
        title: 'Moving Average Plot', 
        content: 'With less smoothing, extreme values are more visible. Peaks and valleys are more pronounced, indicating that the concept is more prominent in those sections. Greater smoothing shows long term trends, and is useful for seeing how the concept changes over the course of the book.', 
        selector: '.moving-average', // Selects the element with id 'mySlider'
        position: { top: '30vh', left: '50vw' } // Example of using viewport units
    },
    { 
        title: 'Interacting with the Graph', 
        content: 'The graph is filled with little dots, each of which represent how the section scored for the emotion. The sections with larger circles around them have an automatic summary associated with them, which can be seen by hovering over the circle.', 
        selector: '#chart', // Selects the element with id 'mySlider'
        position: { top: '50vh', left: '70vw' } // Example of using viewport units
    },
    { 
        title: 'Section Summaries', 
        content: 'When hovering over a dot, this section will populate with a brief summary of the contents in this section.', 
        selector: '#infoText', // Selects the element with id 'mySlider'
        position: { top: '50vh', left: '60vw' } // Example of using viewport units
    },
    { 
        title: 'Book Information', 
        content: 'For the book selected, some information about the book is presented in this section, including a famous quote from the book.', 
        selector: '#infoBox', // Selects the element with id 'mySlider'
        position: { top: '35vh', left: '65vw' } // Example of using viewport units
    },
    { 
        title: 'Additional Information', 
        content: 'For links to the project Github, information about me, and motivation for the project, click this icon.', 
        selector: '.info-icon-container', // Selects the element with id 'mySlider'
        position: { top: '30vh', left: '75vw' } // Example of using viewport units
    }
];

function updateContent() {
    console.log("run upodate")
    const overlay = document.querySelector('.overlay-container');
    const popup = document.querySelector('.popup');
    const popupTitle = popup.querySelector('h1');
    const popupContent = popup.querySelector('p');

    if (step >= 1 && step <= steps.length) {
        const currentStep = steps[step - 1];
        popupTitle.textContent = currentStep.title;
        popupContent.textContent = currentStep.content;

        if (currentStep.selector) {
            const elementToHighlight = document.querySelector(currentStep.selector);
            if (elementToHighlight) {
                highlightElement(elementToHighlight);
            }
        }

        positionPopup(currentStep.position);

        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}
// Function to update the step and handle local storage
function updateStep(newStep) {
    step = newStep;
    localStorage.setItem('onboardingStep', step.toString());
    updateContent();
}

// Function to draw the chart
function drawChart() {
    // Reference the container div
    const containerDiv = document.querySelector('.container');

    // Calculate the width and height for the SVG
    const currentWidth = containerDiv.clientWidth;
    const currentHeight = containerDiv.clientHeight - margin.top - margin.bottom;

    // Remove the existing svg if it exists
    if (svg) {
        svg.remove();
    }

    // Create the SVG element with adjusted width and height
    svg = d3.select("#chart")
        .append("svg")
        .attr("width", currentWidth)
        .attr("height", currentHeight)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Your existing code to draw the chart goes here
    // ...
}

function drawChapterLinesAndSetXAxis(chapterData) {
    const chapterPositions = chapterData.x.map((chapterNumber, index) => {
        const position = chapterData.y.slice(0, index + 1).reduce((a, b) => a + b, 0);
        return { position: position, chapter: chapterNumber };
    });

    // Draw chapter lines
    chapterPositions.forEach(chapter => {
        svg.append('line')
            .attr('x1', xScale(chapter.position))
            .attr('x2', xScale(chapter.position))
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .attr('stroke', 'pink')
            .attr('stroke-width', 2)
            .style('opacity', 0.5)
            .lower();
    });

    // Calculate the maximum number of ticks based on chart width
    const maxTicks = Math.floor(width / 75); // One tick per 50 pixels, adjust as needed
    const tickInterval = Math.ceil(chapterPositions.length / maxTicks);
    const tickValues = chapterPositions
        .filter((_, i) => i % tickInterval === 0)
        .map(chapter => chapter.position);

    // Set x-axis with chapter ticks
    const xAxis = d3.axisBottom(xScale)
    .tickValues(tickValues)
    .tickFormat((d, i) => `${chapterPositions.find(chap => chap.position === d).chapter + 1}`);
    
    // Select or create the x-axis group
    let xAxisGroup = svg.select(".x-axis-group");
    if (xAxisGroup.empty()) {
        xAxisGroup = svg.append("g")
            .attr("class", "x-axis-group")
            .attr("transform", `translate(0, ${height - margin.bottom})`);
    }
    xAxisGroup.call(xAxis);

    // Set font size for tick labels
    xAxisGroup.selectAll("text")
        .style("font-size", "20px");

    // X-Axis Label
    let xLabel = svg.select(".x-axis-label");
    if (xLabel.empty()) {
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height - (margin.bottom / 2)) // Adjust for positioning
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Chapter");
    } else {
        xLabel.attr("x", width / 2)
            .attr("y", height - (margin.bottom / 2))
            .text("Chapter");
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const backButton = document.getElementById('backButton');
    const nextButton = document.getElementById('nextButton');

    updateContent(); // Update content on page load

    nextButton.addEventListener('click', function () {
        updateStep(step + 1);
    });

    backButton.addEventListener('click', function () {
        if (step > 1) {
            updateStep(step - 1);
        }
    });
});


// JavaScript to toggle the popup
document.addEventListener('DOMContentLoaded', function () {
    var infoIcon = document.getElementById('infoIcon');
    var infoPopup = document.getElementById('infoPopup');
    var infoPopupContent = document.getElementById('infoPopupContent');

    // Show the popup when the info icon is clicked
    infoIcon.onclick = function () {
        infoPopup.style.display = 'flex';
    };

    // Hide the popup when clicking outside of the popup content
    infoPopup.onclick = function (event) {
        if (event.target == infoPopup) { // Check if the direct target of the click is the overlay itself
            infoPopup.style.display = 'none';
        }
    };
});

document.addEventListener("DOMContentLoaded", function () {
    // Reference the container div
    const containerDiv = document.querySelector('.container');

    // Calculate the width and height for the SVG
    console.log("containerDiv.clientHeight:", containerDiv.clientHeight);
    width = containerDiv.clientWidth;
    height = containerDiv.clientHeight - margin.top - margin.bottom;

    // Create the SVG element with adjusted width and height
    svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
});


// Event listeners for the dropdowns and slider
const slider = document.getElementById('mySlider');
const sliderValue = document.getElementById('sliderValue');

function updateBookTitle(dataset) {
    d3.json(`./data/${dataset}_info.json`).then(info => {
        document.getElementById('bookTitle').textContent = info.title;
        document.getElementById('bookTitle').style.verticalAlign = 'top'; // Add this line
        document.getElementById('bookAuthor').innerHTML = `<strong>Author:</strong> ${info.author}`;
        document.getElementById('bookYear').innerHTML = `<strong>Year:</strong> ${info.year}`;
        document.getElementById('bookGenre').innerHTML = `<strong>Genre:</strong> ${info.genre}`;
        document.getElementById('bookDetails').innerHTML = `<strong>Details:</strong> ${info.details}`;
        document.getElementById('bookQuote').innerHTML = `<em>${info.quote}</em>`;
        document.getElementById('bookQuote').style.textAlign = 'center';
    });
}

document.getElementById('dataset').addEventListener('change', function () {
    var termValue = document.getElementById('term').value;
    var sliderValue = document.getElementById('mySlider').value;
    svg.selectAll('line').remove();
    svg.select(".x-axis-group").remove();

    updateBookTitle(this.value);
    loadDataset(this.value, termValue, sliderValue);
});

document.getElementById('term').addEventListener('change', function () {
    var datasetValue = document.getElementById('dataset').value;
    var termValue = this.value;
    var sliderValue = document.getElementById('mySlider').value;
    loadDataset(datasetValue, termValue, sliderValue);
});

slider.addEventListener('input', function () {
    var datasetValue = document.getElementById('dataset').value;
    var termValue = document.getElementById('term').value;
    sliderValue.textContent = this.value;
    loadDataset(datasetValue, termValue, this.value);
});

function movingAverage(values, N) {
    const len = values.length;
    const means = new Float64Array(len).fill(NaN);

    for (let i = 0; i < len; ++i) {
        let sum = 0;
        let count = 0;

        // Start and end points for the moving average window
        let start = Math.max(i - Math.floor(N / 2), 0);
        let end = Math.min(i + Math.floor(N / 2), len - 1);

        for (let j = start; j <= end; ++j) {
            sum += values[j];
            count++;
        }

        means[i] = sum / count;
    }

    return means;
}

function loadDataset(datasetName, termValue, sliderValue) {
    // svg.selectAll("*").remove();
    d3.json(`./data/${datasetName}_${termValue}.json`).then(data => {
        const svgCanvas = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Define scales
        xScale = d3.scaleLinear()
            .domain([0, d3.max(data.x)])
            .range([margin.left, width - margin.right]);

        yScale = d3.scaleLinear()
            .domain([d3.min(data.y), d3.max(data.y)]).nice()
            .range([height - margin.bottom, margin.top]);

        const values = movingAverage(data.y, sliderValue);
        const points = data.x.map((value, index) => [value, values[index]]);

        // Plot the moving average
        const smoothedLine = d3.line()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
            .curve(d3.curveLinear);

        const path = svg.selectAll('path.moving-average').data([points]);
        path.enter().append('path')
            .attr('class', 'moving-average')
            .merge(path)
            .attr('d', smoothedLine)
            .attr('fill', 'none')
            .attr('stroke', "#4A4E69")
            .attr('stroke-width', 3)
            .style('opacity', 1);

        path.exit().remove();

        // Handle the small circles
        const circles = svg.selectAll('circle.small-circle').data(data.x);
        circles.enter().append('circle')
            .attr('class', 'small-circle')
            .merge(circles)
            .attr('cx', d => xScale(d))
            .attr('cy', (d, i) => yScale(data.y[i]))
            .attr('r', 3)
            .attr('fill', 'none')
            .attr('stroke', '#C9ADA7')
            .attr('stroke-width', 2)
            .style('opacity', 0.3);

        circles.exit().remove();

        d3.json(`./data/${datasetName}_summary.json`).then(auxData => {
            // Inside your d3.json callback
            const summaryCircles = svg.selectAll(".summaryCircle")
                .data(auxData.x);

            // Enter and update logic for the circles
            summaryCircles.enter()
                .append("circle")
                .merge(summaryCircles) // Combine enter and update selections
                .attr("class", "summaryCircle")
                .attr("cx", d => xScale(d))
                .attr("cy", d => yScale(data.y[data.x.indexOf(d)]))
                .attr("r", 15)
                .attr("fill", "rgba(0, 0, 0, 0)")
                .attr("stroke", "#9A8C98")
                .attr("stroke-width", 3)
                .style("opacity", 0.7)
                .on("mouseover", (event, d) => {
                    console.log("Mouseover event:", event);
                    clearTimeout(timeoutId);
                    const index = auxData.x.indexOf(d);
                    document.querySelector('#infoText .summary-text-row').textContent = auxData.y[index];
                    console.log("index:", index)
                    console.log("auxData.y[index]:", auxData.y[index])
                })
                .on("mouseout", () => {
                    console.log("Mouseout event")
                    timeoutId = setTimeout(() => {
                        document.querySelector('#infoText .summary-text-row').textContent = '';
                    }, 0);
                });

            // Exit logic for the circles
            summaryCircles.exit().remove();

        });

        // Load chapter length data only once
        if (!svg.selectAll('line').empty()) {
            // Skip if chapter lines are already drawn
            return;
        }

        d3.json(`./data/${datasetName}_chapterlength.json`).then(drawChapterLinesAndSetXAxis);

        // Update the y-axis
        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(d3.format(".0%")); // This will format the ticks as percentages

        // Check if y-axis exists, otherwise create
        let yAxisGroup = svg.select(".y-axis-group");
        if (yAxisGroup.empty()) {
            yAxisGroup = svg.append("g")
                .attr("class", "y-axis-group")
                .attr("transform", `translate(${margin.left}, 0)`);
        }
        yAxisGroup.call(yAxis);

        // Adjust the font size here
        yAxisGroup.selectAll("text")
            .style("font-size", "20px"); // Adjust the font size as needed
    });
}

// Initial load
loadDataset("PG0100021", "hope", 50);
updateBookTitle("PG0100021");


// function typeText(element, text) {
//     let i = 0;
//     const typingInterval = setInterval(() => {
//         element.innerHTML += text.charAt(i);
//         i++;
//         if (i === text.length) {
//             clearInterval(typingInterval);
//         }
//     }, 25);
// }
