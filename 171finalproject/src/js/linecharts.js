
// chart svg canvas
//var margin = {top: 40, right: 150, bottom: 40, left: 40};
//var width = 850 - margin.left - margin.right,
//    height = 500 - margin.top - margin.bottom;
//var svg = d3.select("#line-chart-1").append("svg")
//    .attr("width", width + margin.left + margin.right)
//    .attr("height", height + margin.top + margin.bottom)
//    .append("g")
//    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//// initializing variables
//var line = d3.svg.line();
//var allCountries =
//    [
//        "Bangladesh",
//        "Cambodia",
//        "India",
//        "Laos",
//        "Myanmar",
//        "Nepal",
//        "Pakistan",
//        "Sri Lanka",
//        "Thailand",
//        "Vietnam"
//    ];
//var colors = {
//    "Bangladesh": "yellow",
//    "Cambodia": "lightgreen",
//    "India": "red",
//    "Laos": "darkgreen",
//    "Thailand": "blue",
//    "Myanmar": "purple",
//    "Nepal": "orange",
//    "Pakistan": "gray",
//    "Sri Lanka": "magenta",
//    "Vietnam": "violet"
//};
//
//
//var legendYPos = 0;
//var legendXPos = 700;
//var legendSize = 20;
//var legendcolors;
//var legendtext;
//
//var chartData;
//
//// axis scales
//var x = d3.time.scale()
//    .range([0, width]);
//var y = d3.scale.linear()
//    .range([height, 0]);
//var xAxis = d3.svg.axis()
//    .scale(x)
//    .orient("bottom")
//    .tickFormat(d3.time.format("%b"));
//var yAxis = d3.svg.axis()
//    .scale(y)
//    .orient("left");
//
//// append axes
//svg.append("g")
//    .attr("class", "axis x-axis")
//    .attr("transform", "translate(0, " + height + ")");
//svg.append("g")
//    .attr("class", "axis y-axis")
//    .attr("transform", "translate(0, 0)");
//
//// weekly data initialization
//var week;
//countryWeekData = {
//    "Bangladesh": [],
//    "Cambodia": [],
//    "India": [],
//    "Laos": [],
//    "Thailand": [],
//    "Myanmar": [],
//    "Nepal": [],
//    "Pakistan": [],
//    "Sri Lanka": [],
//    "Vietnam": []
//};
//var getNumberWeek = d3.time.format("%W");
//var getWeekDate = d3.time.format("%W-%Y");
//allCountries.forEach(function(d) {
//    for(i=0; i<53; i++) {
//        countryWeekData["" + d][i] = {
//            "number": i,
//            "date": getWeekDate.parse(i + "-2015"),
//            "fatalities": 0,
//            "conflicts": 0
//        };
//    }});
//
//// monthly data initialization
//countryMonthData = {
//    "Bangladesh": [],
//    "Cambodia": [],
//    "India": [],
//    "Laos": [],
//    "Thailand": [],
//    "Myanmar": [],
//    "Nepal": [],
//    "Pakistan": [],
//    "Sri Lanka": [],
//    "Vietnam": []
//};
//var getNumberMonth = d3.time.format("%m");
//var getMonthDate = d3.time.format("%m-%Y");
//var month;
//allCountries.forEach(function(d) {
//    for(i=0; i<12; i++) {
//        countryMonthData["" + d][i] = {
//            "number": i+1,
//            "date": getMonthDate.parse(i+1 + "-2015"),
//            "fatalities": 0,
//            "conflicts": 0
//        };
//    }});
//
//// aggregate data initialization
//var aggChartData = {
//    "number": i+1,
//    "date": getMonthDate.parse(i+1 + "-2015"),
//    "fatalities": 0,
//    "conflicts": 0
//};
//
//function createLineChart(data) {
//
//    // get weekly and monthly data
//    data.forEach(function(d) {
//        week = +getNumberWeek(d.EVENT_DATE);
//        if(week == 53)
//            return;
//        if(d.COUNTRY == "India ")
//            d.COUNTRY = "India";
//        countryWeekData["" + d.COUNTRY][week].fatalities += d.FATALITIES;
//        countryWeekData["" + d.COUNTRY][week].conflicts++;
//    });
//    data.forEach(function(d) {
//        month = +getNumberMonth(d.EVENT_DATE);
//        if(d.COUNTRY == "India ")
//            d.COUNTRY = "India";
//        countryMonthData["" + d.COUNTRY][month-1].fatalities += d.FATALITIES;
//        countryMonthData["" + d.COUNTRY][month-1].conflicts++;
//    });
//
//    // initialize legend variables
//    legendcolors = svg.selectAll("g.legendColors")
//        .data(allCountries, function(d) { return d});
//    legendtext = svg.selectAll("g.legendtext")
//        .data(allCountries, function(d) { return d});
//
//    // append legend text and colors
//    legendcolors.enter()
//        .append('rect')
//        .attr("x", legendXPos)
//        .attr("y", function(d, i) {
//            return (i * legendSize) + legendYPos;
//        })
//        .attr("width", legendSize)
//        .attr("height", legendSize)
//        .style("stroke", "none")
//        .style("fill", function(d){return colors[d]});
//
//    legendtext.enter()
//        .append("text")
//        .attr("class", "legend-text")
//        .attr("id", function(d){ return d})
//        .attr("x", legendXPos + legendSize + 5)
//        .attr("y", function(d, i) {
//            return (i * legendSize) + legendYPos + 15;
//        })
//        .text(function(d) { return d});
//
//    updateChart();
//}
//
//
//function updateChart() {
//
//    //gets user selections
//    var selectedCountries = [];
//    $("input:checkbox[name=country]:checked").each(function(){
//        selectedCountries.push($(this).val());
//    });
//    var selection = d3.select("#select-box-1").property("value");
//    var unitSelection = d3.select("#select-box-2").property("value");
//    var aggregate = d3.select("#select-box-3").property("value");
//
//
//    // gets start and end for x domain
//    var startDay = d3.time.format("%W-%Y").parse("00-2015");
//    var endDay = d3.time.format("%W-%Y").parse("52-2015");
//
//    // sets monthly or weekly data
//    if(unitSelection == "monthly")
//        chartData = countryMonthData;
//    else if(unitSelection == "weekly")
//        chartData = countryWeekData;
//
//    // finds max for y domain
//    var countryMax =  selectedCountries.map(function(d) {
//        var place = d;
//        return d3.max(chartData["" + place], function(d) {return d["" + selection]})
//    });
//
//
//    // set axis domains
//    y.domain([0,d3.max(countryMax, function(d) {return d})]);
//    x.domain([startDay, endDay]);
//
//    // define line function
//    line
//        .x(function(d) { return x(d.date); })
//        .y(function(d) { return y(d["" + selection]); })
//        .interpolate("linear");
//
//
//    var countryLines = svg.selectAll("path")
//        .data(selectedCountries, function(d) { return d});
//
//    countryLines
//        .enter()
//        .append("path")
//        .attr("class", "lines")
//        .on('mouseover',function(d) {
//            d3.select(this)
//                .style("stroke-width","5");
//            var notThis = $('.lines').not(this);
//            d3.selectAll(notThis)
//                .style("opacity",0.3);
//            var cntryName = document.getElementById(d);
//            var selectlegend = $('.legend-text').not(cntryName);
//            d3.selectAll(selectlegend)
//                .style("opacity",.2);
//            d3.select(cntryName)
//            .style("font-weight", "bold");
//        })
//        .on('mouseout', function(d) {
//            d3.select(this)
//                .style("stroke-width","2");
//            var notThis = $('.lines').not(this);
//            d3.selectAll(notThis)
//                .style("opacity",1);
//            var cntryName = document.getElementById(d);
//            var selectlegend = $('.legend-text').not(cntryName);
//            d3.selectAll(selectlegend)
//                .style("opacity", 1);
//            d3.select(cntryName)
//                .style("font-weight", "normal");
//        });
//
//    countryLines
//        .transition()
//        .duration(700)
//        .attr("d", function(d) {
//            return line(chartData["" + d])})
//        .attr("fill", "none")
//        .attr("stroke", function(d) { return colors[d]})
//        .attr("stroke-width", "2");
//
//    countryLines.exit().remove();
//
//
//     //  updates axes
//     svg.select(".x-axis")
//         .transition()
//         .duration(700)
//         .call(xAxis);
//     svg.select(".y-axis")
//         .transition()
//         .duration(700)
//         .call(yAxis);
//
//}

/**
 * Created by Kevin on 4/22/16.
 */

/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the
 */

Linechart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    // No data wrangling, no update sequence
    this.initVis();
}

Linechart.prototype.updateChart = function(){
        //gets user selections
    var vis = this;
        vis.selectedCountries = [];
        $("input:checkbox[name=country]:checked").each(function(){
            vis.selectedCountries.push($(this).val());
        });
    vis.selection = d3.select("#select-box-1").property("value");
    vis.unitSelection = d3.select("#select-box-2").property("value");
    vis.aggregate = d3.select("#select-box-3").property("value");


        // gets start and end for x domain
    vis.startDay = d3.time.format("%W-%Y").parse("00-2015");
    vis.endDay = d3.time.format("%W-%Y").parse("52-2015");

        // sets monthly or weekly data
        if(vis.unitSelection == "monthly")
            vis.chartData = vis.countryMonthData;
        else if(vis.unitSelection == "weekly")
            vis.chartData = vis.countryWeekData;

        // finds max for y domain
    vis.countryMax =  vis.selectedCountries.map(function(d) {
            var place = d;
            return d3.max(vis.chartData["" + place], function(d) {return d["" + vis.selection]})
        });


        // set axis domains
    vis.y.domain([0,d3.max(vis.countryMax, function(d) {return d})]);
    vis.x.domain([vis.startDay, vis.endDay]);

        // define line function
    vis.line
            .x(function(d) { return vis.x(d.date); })
            .y(function(d) { return vis.y(d["" + vis.selection]); })
            .interpolate("linear");


    vis.countryLines = vis.svg.selectAll("path")
            .data(vis.selectedCountries, function(d) { return d});

    vis.countryLines
            .enter()
            .append("path")
            .attr("class", "lines")
            .on('mouseover',function(d) {
                d3.select(this)
                    .style("stroke-width","5");
                var notThis = $('.lines').not(this);
                d3.selectAll(notThis)
                    .style("opacity",0.3);
                var cntryName = document.getElementById(d);
                //var selectlegend = $('.legend-text').not(cntryName);
                //d3.selectAll(selectlegend)
                //    .style("opacity",.2);
                d3.select(cntryName)
                    .style("font-weight", "bold");
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .style("stroke-width","2");
                var notThis = $('.lines').not(this);
                d3.selectAll(notThis)
                    .style("opacity",1);
                var cntryName = document.getElementById(d);
                //var selectlegend = $('.legend-text').not(cntryName);
                //d3.selectAll(selectlegend)
                //    .style("opacity", 1);
                d3.select(cntryName)
                    .style("font-weight", "normal");
            });

    vis.countryLines
            .transition()
            .duration(700)
            .attr("d", function(d) {
                return vis.line(vis.chartData["" + d])})
            .attr("fill", "none")
            .attr("stroke", function(d) { return vis.colors[d]})
            .attr("stroke-width", "2");

    vis.countryLines.exit().remove();


        //  updates axes
    vis.svg.select(".x-axis")
            .transition()
            .duration(700)
            .call(vis.xAxis);
    vis.svg.select(".y-axis")
            .transition()
            .duration(700)
            .call(vis.yAxis);


}
/*
 * Initialize area chart with brushing component
 */

Linechart.prototype.initVis = function(){
    var vis = this; // read about the this

    vis.margin = {top: 40, right: 150, bottom: 40, left: 40};
    vis.width = 850 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;
    vis.svg = d3.select("#line-chart-1").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

// initializing variables
    vis.line = d3.svg.line();
    vis.allCountries =
        [
            "Bangladesh",
            "Cambodia",
            "India",
            "Laos",
            "Myanmar",
            "Nepal",
            "Pakistan",
            "Sri Lanka",
            "Thailand",
            "Vietnam"
        ];
    vis.colors = {
        "Bangladesh": "yellow",
        "Cambodia": "lightgreen",
        "India": "red",
        "Laos": "darkgreen",
        "Thailand": "blue",
        "Myanmar": "purple",
        "Nepal": "orange",
        "Pakistan": "gray",
        "Sri Lanka": "magenta",
        "Vietnam": "violet"
    };


    //vis.legendYPos = 0;
    //vis.legendXPos = 700;
    //vis.legendSize = 20;
    //vis.legendcolors;
    //vis.legendtext;

    vis.chartData;

// axis scales
    vis.x = d3.time.scale()
        .range([0, vis.width]);
    vis.y = d3.scale.linear()
        .range([vis.height, 0]);
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .tickFormat(d3.time.format("%b"));
    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

// append axes
    vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0, " + vis.height + ")");
    vis.svg.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(0, 0)");

// weekly data initialization
    vis.week;
    vis.countryWeekData = {
        "Bangladesh": [],
        "Cambodia": [],
        "India": [],
        "Laos": [],
        "Thailand": [],
        "Myanmar": [],
        "Nepal": [],
        "Pakistan": [],
        "Sri Lanka": [],
        "Vietnam": []
    };
    vis.getNumberWeek = d3.time.format("%W");
    vis.getWeekDate = d3.time.format("%W-%Y");
    vis.allCountries.forEach(function(d) {
        for(i=0; i<53; i++) {
            vis.countryWeekData["" + d][i] = {
                "number": i,
                "date": vis.getWeekDate.parse(i + "-2015"),
                "fatalities": 0,
                "conflicts": 0
            };
        }});

// monthly data initialization
    vis.countryMonthData = {
        "Bangladesh": [],
        "Cambodia": [],
        "India": [],
        "Laos": [],
        "Thailand": [],
        "Myanmar": [],
        "Nepal": [],
        "Pakistan": [],
        "Sri Lanka": [],
        "Vietnam": []
    };
    vis.getNumberMonth = d3.time.format("%m");
    vis.getMonthDate = d3.time.format("%m-%Y");
    vis.month;
    vis.allCountries.forEach(function(d) {
        for(i=0; i<12; i++) {
            vis.countryMonthData["" + d][i] = {
                "number": i+1,
                "date": vis.getMonthDate.parse(i+1 + "-2015"),
                "fatalities": 0,
                "conflicts": 0
            };
        }});

// aggregate data initialization
    vis.aggChartData = {
        "number": i+1,
        "date": vis.getMonthDate.parse(i+1 + "-2015"),
        "fatalities": 0,
        "conflicts": 0
    };


    // get weekly and monthly data
    vis.data.forEach(function(d) {
        vis.week = +vis.getNumberWeek(d.EVENT_DATE);
        if(vis.week == 53)
            return;
        if(d.COUNTRY == "India ")
            d.COUNTRY = "India";
        vis.countryWeekData["" + d.COUNTRY][vis.week].fatalities += d.FATALITIES;
        vis.countryWeekData["" + d.COUNTRY][vis.week].conflicts++;
    });
    vis.data.forEach(function(d) {
        vis.month = +vis.getNumberMonth(d.EVENT_DATE);
        if(d.COUNTRY == "India ")
            d.COUNTRY = "India";
        vis.countryMonthData["" + d.COUNTRY][vis.month-1].fatalities += d.FATALITIES;
        vis.countryMonthData["" + d.COUNTRY][vis.month-1].conflicts++;
    });

    // initialize legend variables
    //vis.legendcolors = vis.svg.selectAll("g.legendColors")
    //    .data(vis.allCountries, function(d) { return d});
    //vis.legendtext = vis.svg.selectAll("g.legendtext")
    //    .data(vis.allCountries, function(d) { return d});

    // append legend text and colors
    //vis.legendcolors.enter()
    //    .append('rect')
    //    .attr("x", vis.legendXPos)
    //    .attr("y", function(d, i) {
    //        return (i * vis.legendSize) + vis.legendYPos;
    //    })
    //    .attr("width", vis.legendSize)
    //    .attr("height", vis.legendSize)
    //    .style("stroke", "none")
    //    .style("fill", function(d){return vis.colors[d]});
    //
    //vis.legendtext.enter()
    //    .append("text")
    //    .attr("class", "legend-text")
    //    .attr("id", function(d){ return d})
    //    .attr("x", vis.legendXPos + vis.legendSize + 5)
    //    .attr("y", function(d, i) {
    //        return (i * vis.legendSize) + vis.legendYPos + 15;
    //    })
    //    .text(function(d) { return d});

    $("input:checkbox[name=country]").on("click", function(){
        vis.updateChart();
    });
    $(".select-box").change(function(){
        console.log("Select!");
        vis.updateChart();
    });

    vis.updateChart();
}






