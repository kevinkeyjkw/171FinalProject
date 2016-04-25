

var margin = {top: 20, right: 30, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


var xAxis;
var yAxis;
var xAxisUpdate;
var yAxisUpdate;
var max = 0;
var display;
var Alldata;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], 0.3);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.ordinal()
    .range(["#98abc5", "#7b6888", "#a05d56", "#ff8c00"]);



var svg = d3.select("#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var dateFormat = d3.time.format("%d-%B-%Y");
var conflictTypes = [];
var selectCountries = ["Bangladesh", "Cambodia", "India", "Myanmar", "Nepal", "Pakistan", "Sri Lanka", "Thailand"];
var countryDic = {"Bangladesh":0, "Cambodia":1, "India":2, "Myanmar":3, "Nepal":4, "Pakistan":5, "Sri Lanka":6, "Thailand":7};
var conflictNames = ["Battle-No change of territory","Riots/Protests","Remote violence", "Violence against civilians"];
var conflictDic = {"Battle-No change of territory":0,"Riots/Protests":1,"Remote violence":2, "Violence against civilians":3};
var selection = "Conflicts";



readData();

function readData() {
    d3.csv("ACLED-Asia-Version-1-20151.csv", function (allData) {

        // Convert strings to numbers
        allData.forEach(function (d) {
            d.EVENT_DATE = dateFormat.parse(d.EVENT_DATE);
            d.FATALITIES = +d.FATALITIES;
            d.LATITUDE = +d.LATITUDE;
            d.LONGITUDE = +d.LONGITUDE;

            // Determine how many types of conflicts, needed for legend
            if (conflictTypes.indexOf(d.EVENT_TYPE.trim().toLowerCase()) == -1) {
                conflictTypes.push(d.EVENT_TYPE.trim().toLowerCase());
            }
        });

        Alldata = allData;

        // create a matrix for stacked chart
        display = d3.range(selectCountries.length).map(function() { return d3.range(conflictNames.length).map(Math.random).map(Math.floor); });

        allData.forEach(function (d) {
            if (d.COUNTRY in countryDic && d.EVENT_TYPE in conflictDic) {
                display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]] += 1;
                if (display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]] >= max) {
                    max = display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]];
                }
            }
        });

        var data = [];
        // create array of dictionary for plotting
        for (i=0; i<selectCountries.length; i++) {
            data.push({
                "Battle-No change of territory": display[i][0],
                "Riots/Protests": display[i][1],
                "Remote violence": display[i][2],
                "Violence against civilians": display[i][3],
                "country": selectCountries[i]
            });
        }

        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        xAxisUpdate = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        yAxisUpdate = svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .attr("transform", "rotate(0)");



        updateVisualization();

    });
}


// Render visualization
function updateVisualization() {
    var users = document.getElementById("y-type");
    selection = users.options[users.selectedIndex].value;


    // create a matrix for stacked chart
    display = d3.range(selectCountries.length).map(function() { return d3.range(conflictNames.length).map(Math.random).map(Math.floor); });

    max=0;
    if (selection=="Fatalities") {
        Alldata.forEach(function (d) {
            if (d.COUNTRY in countryDic && d.EVENT_TYPE in conflictDic) {
                display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]] += d.FATALITIES;
                if (display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]] >= max) {
                    max = display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]];
                }
            }
        });
    } else {
        Alldata.forEach(function (d) {
            if (d.COUNTRY in countryDic && d.EVENT_TYPE in conflictDic) {
                display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]] += 1;
                if (display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]] >= max) {
                    max = display[countryDic[d.COUNTRY]][conflictDic[d.EVENT_TYPE]];
                }
            }
        });
    }

    var data = [];
    // create array of dictionary for plotting
    for (i=0; i<selectCountries.length; i++) {
        data.push({
            "Battle-No change of territory": display[i][0],
            "Riots/Protests": display[i][1],
            "Remote violence": display[i][2],
            "Violence against civilians": display[i][3],
            "country": selectCountries[i]
        });
    }


    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "country"; }));

    data.forEach(function(d) {
        var y0 = 0;
        d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
        d.total = d.ages[d.ages.length - 1].y1;
    });

    data.sort(function(a, b) { return b.total - a.total; });

    x.domain(data.map(function(d) { return d.country; }));
    y.domain([0, d3.max(data, function(d) { return d.total; })]);

    // update axis
    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    xAxisUpdate.transition()
        .duration(800).call(xAxis);
    yAxisUpdate.transition()
        .duration(800).call(yAxis);

  /*
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Conflicts");
*/

    var state = svg.selectAll(".state")
        .data(data)
        .enter().append("g").attr("class", "g")
        .attr("transform", function(d) { return "translate(" + x(d.country) + ",0)"; })
        .selectAll("rect")
        .data(function(d) { return d.ages;});



    state
        .enter()
        .append("rect")
        .attr("class", "bar");
        //.attr("transform", function(d) { return "translate(" + x(d.country) + ",0)"; });

    // Update (set the dynamic properties of the elements)
    state
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .transition()
        .duration(500)
        .attr("width", x.rangeBand())
        .attr("height", function(d) { return y(d.y0) - y(d.y1); })
        .attr("y", function(d) { return y(d.y1); })
        .style("fill", function(d) { return color(d.name); });


    // Exit
    state.exit().remove();



    var legend = svg.selectAll(".legend")
        .data(color.domain().slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });



}


