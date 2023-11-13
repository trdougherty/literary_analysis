// Define the margins of the chart
const margin = { top: 15, right: 50, bottom: 88, left: 30 };
let svg; // Declare svg here to make it accessible in the global scope
let width, height; // Declare width and height here for global access
let timeoutId;

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
    // Clear the SVG container
    // svg.selectAll("*").remove();
    d3.json(`./data/${datasetName}_${termValue}.json`).then(data => {
        const svgCanvas = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Define scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data.x)])
            .range([margin.left, width - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(data.y), d3.max(data.y)]).nice()
            .range([height - margin.bottom, margin.top]);

        const values = movingAverage(data.y, sliderValue);
        const points = data.x.map((value, index) => [value, values[index]]);

        // Plot the moving average
        const smoothedLine = d3.line()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
            .curve(d3.curveNatural);

        const path = svg.selectAll('path.moving-average').data([points]);
        path.enter().append('path')
            .attr('class', 'moving-average')
            .merge(path)
            .attr('d', smoothedLine)
            .attr('fill', 'none')
            .attr('stroke', 'black')
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
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .style('opacity', 0.1);

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
                .attr("stroke", "#3793FF")
                .attr("stroke-width", 3)
                .style("opacity", 0.7)
                .on("mouseover", (event, d) => {
                    console.log("Mouseover event:", event);
                    clearTimeout(timeoutId);
                    const index = auxData.x.indexOf(d);
                    document.getElementById('infoText').textContent = auxData.y[index];
                    console.log("index:", index)
                    console.log("auxData.y[index]:", auxData.y[index])
                })
                .on("mouseout", () => {
                    console.log("Mouseout event")
                    timeoutId = setTimeout(() => {
                        document.getElementById('infoText').textContent = '';
                    }, 0);
                });

            // Exit logic for the circles
            summaryCircles.exit().remove();

        });


        // Update the x-axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d3.format("d"));

        // Check if x-axis exists, otherwise create
        let xAxisGroup = svg.select(".x-axis-group");
        if (xAxisGroup.empty()) {
            xAxisGroup = svg.append("g")
                .attr("class", "x-axis-group")
                .attr("transform", `translate(0, ${height - margin.bottom + margin.top})`);
        }
        xAxisGroup.call(xAxis);
        xAxisGroup.selectAll("text")
            .style("font-size", "16px");  // Adjust this value to your desired font size

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
            .style("font-size", "16px"); // Adjust the font size as needed
    });
}

// Initial load
loadDataset("PG100001", "hope", 50);
updateBookTitle("PG100001");

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
