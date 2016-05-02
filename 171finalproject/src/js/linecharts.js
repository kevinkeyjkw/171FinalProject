var cleanData;
var linechart;
var dateFormat = d3.time.format("%d-%B-%Y");
var monthFormat = d3.time.format("%B");
var map;


// initialize projection parameters and path
var projection = d3.geo.mercator()
    .translate([600 / 2, 340 / 2])
    .scale(550)
    .center([90,22]);
var path = d3.geo.path()
    .projection(projection);


// Use the Queue.js library to read two files

queue()
    .defer(d3.json, "countries.topojson")
    .defer(d3.csv, "ACLED-Asia-Version-1-20151.csv")
    .await(function(error, mapTopJson, allData){

        // update map variable with geo data
        map = topojson.feature(mapTopJson, mapTopJson.objects.subunits).features;

        // Convert strings to numbers
        allData.forEach(function (d) {
            d.EVENT_DATE = dateFormat.parse(d.EVENT_DATE);
            d.FATALITIES = +d.FATALITIES;
            d.LATITUDE = +d.LATITUDE;
            d.LONGITUDE = +d.LONGITUDE;
        });
        cleanData = allData;

        linechart = new Linechart("line-chart", cleanData);

    });


Linechart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    // No data wrangling, no update sequence
    this.initVis();
    this.initLegend();

};


Linechart.prototype.updateChart = function(){
    d3.selectAll(".legend-text")
        .attr("opacity", 0.2);
    d3.selectAll(".legend-color")
        .attr("opacity", 0.2);
    d3.selectAll(".maplines")
        .attr("opacity", 0.1);


    var vis = this;
        vis.selectedCountries = [];
        $("input:checkbox[name=country]:checked").each(function(){
            vis.selectedCountries.push($(this).val());
            d3.select("#" + $(this).val() + "-legend-text")
                .attr("opacity", 1);
            d3.select("#" + $(this).val() + "-legend-color")
                .attr("opacity", 1);
            d3.select(document.getElementById("" + $(this).val() + "-legend-text"))
                .attr("opacity", 1);
            d3.select(document.getElementById("" + $(this).val() + "-legend-color"))
                .attr("opacity", 1);
            d3.select("#" + $(this).val() + "-map")
                .attr("opacity",1);
        });
    vis.selection = d3.select("#select-box-1").property("value");
    vis.unitSelection = d3.select("#select-box-2").property("value");

        // gets start and end for x domain
    vis.startDay = d3.time.format("%W-%Y").parse("00-2015");
    vis.endDay = d3.time.format("%W-%Y").parse("52-2015");

        // finds max for y domain
    vis.countryChartMax =  vis.selectedCountries.map(function(d) {
            var place = d;
            return d3.max(vis.countryMonthData["" + place], function(d) {return d["" + vis.selection]["" + vis.unitSelection]})
        });

    vis.countryMonthMax = function(cntry) {
        return d3.max(vis.countryMonthData["" + cntry],
            function (d) {
                return d["" + vis.selection]["" + vis.unitSelection]
            })
    };

    vis.countryBarMax =  vis.selectedCountries.map(function(d) {
        return vis.countryYearData["" + d]["" + vis.selection]["" + vis.unitSelection]});

    //var test = $.inArray(99, vis.countryMonthData["India"].fatalities["all"]);
    //console.log(test);

    vis.countryMonthMaxDate = function(cntry) {
        return vis.countryMonthData["" + cntry].filter(function (d) {
            if(d["" + vis.selection]["" + vis.unitSelection] == vis.countryMonthMax(cntry))
                return true
        })[0].date;
    };


        // set axis domains
    vis.y.domain([0,d3.max(vis.countryChartMax, function(d) {return d})]);
    vis.x.domain([vis.startDay, vis.endDay]);

    vis.xBar.domain(vis.selectedCountries);
    vis.yBar.domain([0,d3.max(vis.countryBarMax, function(d) {return d})]);


        // define line function
    vis.line
            .x(function(d) { return vis.x(d.date); })
            .y(function(d) { return vis.y(d["" + vis.selection]["" + vis.unitSelection]); })
            .interpolate("linear");

    vis.countryChartText = vis.svg.selectAll("text.chartMax")
        .data(vis.selectedCountries, function(d) { return d});

    vis.countryChartText
        .enter()
        .append("text")
        .attr("class", "chartMax")
        .attr("id", function(d) {return "" + d + "-chart-text"})
    ;

    vis.countryChartText
        .transition()
        .duration(700)
        .attr("x", function(d) {return  -10 + vis.x(vis.countryMonthMaxDate(d))})
        .attr("y", function(d) {return -5 + vis.y(vis.countryMonthMax(d))})
        .text(function(d) {return "" + vis.countryMonthMax(d) + " " + vis.selection + " in " + monthFormat(vis.countryMonthMaxDate(d))})
        .style("font-size", 12)
        .style("font-weight", "bold")
        .style("visibility", "hidden");

    vis.countryChartText
        .exit().remove();


    vis.countryBarText = vis.svgBar.selectAll("text.barMax")
        .data(vis.selectedCountries, function(d) { return d});

    vis.countryBarText
        .enter()
        .append("text")
        .attr("class", "barMax")
        .attr("id", function(d) {return "" + d + "-bar-text"})
        ;

    vis.countryBarText
        .transition()
        .duration(700)
        .attr("x", function(d) {return  vis.xBar(d)})
        .attr("y", function(d) {return -5 + vis.yBar(vis.countryYearData["" + d]["" + vis.selection]["" + vis.unitSelection])})
        .text(function(d) {return "" + vis.countryYearData["" + d]["" + vis.selection]["" + vis.unitSelection] + " total " + vis.selection})
        .style("font-size", 12)
        .style("font-weight", "bold")
        .style("visibility", "hidden");

    vis.countryBarText
        .exit().remove();

    vis.countryLines = vis.svg.selectAll("path")
            .data(vis.selectedCountries, function(d) { return d});

    vis.countryLines
            .enter()
            .append("path")
            .attr("class", "lines")
            .attr("id", function(d) {return "" + d + "-line"})
            .on('mouseover',function(d) {
                d3.select(this)
                    .style("stroke-width","5");
                var notThis = $('.lines').not(this);
                d3.selectAll(notThis)
                    .style("opacity",0.3);
                var cntryName = document.getElementById("" + d + "-legend-text");
                d3.select(cntryName)
                    .style("font-weight", "bold");
                var notThisBar = $('.bars').not("#" + d + "-bar");
                d3.selectAll(notThisBar)
                    .style("opacity", 0.3);
                var cntryCircle = document.getElementById("" + d + "-legend-color");
                d3.select(cntryCircle)
                    .style("stroke", "black");
                d3.select("#" + d + "-map")
                    .style("stroke", "black");
                d3.select("#" + d + "-bar")
                    .style("stroke","black");
                d3.select("#" + d + "-bar-text")
                    .style("visibility", "visible");
                d3.select("#" + d + "-chart-text")
                    .style("visibility", "visible")
            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .style("stroke-width","2");
                var notThis = $('.lines').not(this);
                d3.selectAll(notThis)
                    .style("opacity",1);
                var cntryName = document.getElementById("" + d + "-legend-text");
                d3.select(cntryName)
                    .style("font-weight", "normal");
                var notThisBar = $('.bars').not("#" + d + "-bar");
                d3.selectAll(notThisBar)
                    .style("opacity", 1);
                var cntryCircle = document.getElementById("" + d + "-legend-color");
                d3.select(cntryCircle)
                    .style("stroke", "none");
                d3.select("#" + d + "-map")
                    .style("stroke", "none");
                d3.select("#" + d + "-bar")
                    .style("stroke","none");
                d3.select("#" + d + "-bar-text")
                    .style("visibility", "hidden");
                d3.select("#" + d + "-chart-text")
                    .style("visibility", "hidden")
            })
            .on('click', function (d) {
                $('#' + d + "-check").prop('checked', function (i, value) {
                    return !value;});
                var notThis = $('.lines').not(this);
                d3.selectAll(notThis)
                    .style("opacity",1);
                var cntryName = document.getElementById("" + d + "-legend-text");
                d3.select(cntryName)
                    .style("font-weight", "normal");
                d3.select("#" + d + "-map")
                    .style("stroke", "none");
                vis.updateChart();
            });

    vis.countryLines
            .transition()
            .duration(700)
            .attr("d", function(d) {
                return vis.line(vis.countryMonthData["" + d])})
            .attr("fill", "none")
            .attr("stroke", function(d) { return vis.colors[d]})
            .attr("stroke-width", "2");

    vis.countryLines.exit().remove();

    vis.countryBars = vis.svgBar.selectAll("rect.bars")
        .data(vis.selectedCountries, function(d) { return d});

    vis.countryBars
        .enter()
        .append("rect")
        .attr("class", "bars")
        .attr("id", function(d) {return "" + d + "-bar"})
        .on('mouseover',function(d) {
            var notThis = $('.bars').not(this);
            d3.selectAll(notThis)
                .style("opacity",0.3);
            var cntryName = document.getElementById("" + d + "-legend-text");
            d3.select(cntryName)
                .style("font-weight", "bold");
            var notThisLine = $('.lines').not("#" + d + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 0.3);
            var thisLine = $("#" + d + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "5");
            var cntryCircle = document.getElementById("" + d + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "black");
            d3.select("#" + d + "-map")
                .style("stroke", "black");
            d3.select("#" + d + "-bar-text")
                .style("visibility", "visible");
            d3.select("#" + d + "-chart-text")
                .style("visibility", "visible")
        })
        .on('mouseout', function(d) {
            var notThis = $('.bars').not(this);
            d3.selectAll(notThis)
                .style("opacity",1);
            var cntryName = document.getElementById("" + d + "-legend-text");
            d3.select(cntryName)
                .style("font-weight", "normal");
            var notThisLine = $('.lines').not("#" + d + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 1);
            var thisLine = $("#" + d + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "2");
            var cntryCircle = document.getElementById("" + d + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "none");
            d3.select("#" + d + "-map")
                .style("stroke", "none");
            d3.select("#" + d + "-bar-text")
                .style("visibility", "hidden");
            d3.select("#" + d + "-chart-text")
                .style("visibility", "hidden")

        })
        .on('click', function (d) {
            $('#' + d + "-check").prop('checked', function (i, value) {
                return !value;});
            var notThis = $('.bars').not(this);
            d3.selectAll(notThis)
                .style("opacity",1);
            var cntryName = document.getElementById("" + d + "-legend-text");
            d3.select(cntryName)
                .style("font-weight", "normal");
            vis.updateChart();
            d3.select("#" + d + "-map")
                .style("stroke", "none");
        });

    vis.countryBars
        .transition()
        .duration(700)
        .attr("d", function(d) {
            return vis.line(vis.countryMonthData["" + d])})
        .attr("fill", function(d) { return vis.colors[d]})
        .attr("x", function(d) { return vis.xBar(d); })
        .attr("width", vis.xBar.rangeBand())
        .attr("stroke-width", 3)
        .attr("y", function(d) { return vis.yBar(vis.countryYearData["" +d]["" + vis.selection]["" + vis.unitSelection]); })
        .attr("height", function(d) { return vis.heightBar - vis.yBar(vis.countryYearData["" +d]["" + vis.selection]["" + vis.unitSelection]); });

    vis.countryBars.exit().remove();

        //  updates axes
    vis.svg.select(".x-axis")
            .transition()
            .duration(700)
            .call(vis.xAxis);
    vis.svg.select(".y-axis")
            .transition()
            .duration(700)
            .call(vis.yAxis);

    //  updates axes
    vis.svgBar.select(".x-axis")
        .transition()
        .duration(700)
        .call(vis.xAxisBar);
    vis.svgBar.select(".y-axis")
        .transition()
        .duration(700)
        .call(vis.yAxisBar);


};
/*
 * Initialize area chart with brushing component
 */

Linechart.prototype.initVis = function() {
    var vis = this; // read about the this

// initializing variables
    vis.line = d3.svg.line();
    vis.allCountries =
        [
            "Pakistan",
            "India",
            "Nepal",
            "Bangladesh",
            "Myanmar",
            "Thailand",
            "Laos",
            "Cambodia",
            //"Sri Lanka",
            "Vietnam"
        ];
    vis.colors = {
        "Bangladesh": "#1f77b4",
        "Cambodia": "#ff7f0e",
        "India": "#2ca02c",
        "Laos": "#d62728",
        "Thailand": "#9467bd",
        "Myanmar": "#8c564b",
        "Burma": "#e377c2",
        "Nepal": "#7f7f7f",
        "Pakistan": "#bcbd22",
        //"Sri Lanka": "#17becf",
        "Vietnam": "#1f77b4"
    };

    vis.marginMap = {top: 0, right: 0, bottom: 0, left: 0};
    vis.widthMap = 600 - vis.marginMap.left - vis.marginMap.right;
    vis.heightMap = 340 - vis.marginMap.top - vis.marginMap.bottom;
    vis.svgMap = d3.select("#topo-map").append("svg")
        .attr("width", vis.widthMap + vis.marginMap.left + vis.marginMap.right)
        .attr("height", vis.heightMap + vis.marginMap.top + vis.marginMap.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.marginMap.left + "," + vis.marginMap.top + ")");

    vis.marginView = {top: 0, right: 20, bottom: 0, left: 20};
    vis.widthView = 600 - vis.marginView.left - vis.marginView.right;
    vis.heightView = 100 - vis.marginView.top - vis.marginView.bottom;
    vis.svgView = d3.select("#view-text").append("svg")
        .attr("width", vis.widthView + vis.marginView.left + vis.marginView.right)
        .attr("height", vis.heightView + vis.marginView.top + vis.marginView.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.marginView.left + "," + vis.marginView.top + ")");

    var asiaMap = map.filter( function(d) {
        if (d.properties.name == "Bangladesh" ||
            d.properties.name == "Cambodia" ||
            d.properties.name == "India" ||
            d.properties.name == "Laos" ||
            d.properties.name == "Nepal" ||
            d.properties.name == "Pakistan" ||
            //d.properties.name == "Sri Lanka" ||
            d.properties.name == "Thailand" ||
            d.properties.name == "Vietnam")
                return true;
        else if (d.properties.name == "Myanmar (Burma)") {
            d.properties.name = "Myanmar";
            return true;}});

    vis.mapLinks = vis.svgMap;

    vis.mapLinks
        .append("text")
        .attr("x", 500)
        .attr("y", 10)
        .attr("id", "select-all")
        .attr("text-anchor", "end")
        .attr("class", "link")
        .text("Select All Countries")
        .attr();

    vis.mapLinks.append("text")
        .attr("x", 500)
        .attr("y", 30)
        .attr("class", "link")
        .attr("id", "select-none")
        .attr("text-anchor", "end")
        .text("Select None");

    // join geo data to paths
    vis.countries = vis.svgMap.selectAll("path")
        .data(asiaMap);

    // append paths with enter
    vis.countries.enter()
        .append("path")
        .attr("class", "maplines")
        .attr("id", function(d){
            return "" + d.properties.name + "-map"
        })
        .on('mouseover',function(d) {
            d3.select(this)
                .style("stroke", "black");
            var cntryName = document.getElementById("" + d.properties.name + "-legend-text");
            d3.select(cntryName)
                .style("font-weight", "bold");
            var cntryCircle = document.getElementById("" + d.properties.name + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "black");
            var notThisLine = $('.lines').not("#" + d.properties.name + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 0.3);
            var thisLine = $("#" + d.properties.name + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "5");
            d3.select("#" + d.properties.name + "-bar")
                .style("stroke","black");
            d3.select("#" + d.properties.name + "-bar-text")
                .style("visibility", "visible");
            d3.select("#" + d.properties.name + "-chart-text")
                .style("visibility", "visible");
            var notThisBar = $('.bars').not("#" + d.properties.name + "-bar");
            d3.selectAll(notThisBar)
                .style("opacity", 0.3);
            d3.selectAll("#" + d.properties.name + "-bar.bars")
                .style("stroke-color", "black");
        })
        .on('mouseout', function(d) {
            d3.select(this)
                .style("stroke", "none");
            var cntryName = document.getElementById("" + d.properties.name + "-legend-text");
            d3.select(cntryName)
                .style("font-weight", "normal");
            var cntryCircle = document.getElementById("" + d.properties.name + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "none");
            var notThisLine = $('.lines').not("#" + d.properties.name + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 1);
            var thisLine = $("#" + d.properties.name + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "2");
            d3.select("#" + d.properties.name + "-bar")
                .style("stroke","none");
            d3.select("#" + d.properties.name + "-bar-text")
                .style("visibility", "hidden");
            d3.select("#" + d.properties.name + "-chart-text")
                .style("visibility", "hidden");
            var notThisBar = $('.bars').not("#" + d.properties.name + "-bar");
            d3.selectAll(notThisBar)
                .style("opacity", 1);
            d3.selectAll("#" + d.properties.name + "-bar.bars")
                .style("stroke-color", "none");
        })
        .on('click', function (d) {
            $('#' + d.properties.name + "-check").prop('checked', function (i, value) {
                return !value;});
            var notThis = $('.bars').not(this);
            d3.selectAll(notThis)
                .style("opacity",1);
            var cntryName = document.getElementById("" + d + "-legend-text");
            d3.select(cntryName)
                .style("font-weight", "normal");
            vis.updateChart();
        });

    // update country fill
    vis.countries
        .attr("stroke", "none")
        .attr("stroke-width", "3")
        .attr("fill", function(d) {
            return vis.colors[d.properties.name];})
        .attr("opacity",.2)
        .attr("d", path);

    // exit (not needed?)
    vis.countries.exit()
        .remove();



    vis.margin = {top: 15, right: 100, bottom: 30, left: 40};
    vis.width = 700 - vis.margin.left - vis.margin.right;
        vis.height = 250 - vis.margin.top - vis.margin.bottom;
    vis.svg = d3.select("#line-chart").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");





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


    // aggregate data initialization
    vis.countryYearData = {
        "Pakistan": {},
        "India": {},
        "Nepal": {},
        "Bangladesh": {},
        "Myanmar": {},
        "Thailand": {},
        "Laos": {},
        "Cambodia": {},
        //"Sri Lanka": {},
        "Vietnam": {}
    };

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
        //"Sri Lanka": [],
        "Vietnam": []
    };
    vis.getNumberMonth = d3.time.format("%m");
    vis.getMonthDate = d3.time.format("%m-%Y");
    vis.month;
    vis.allCountries.forEach(function (d) {
        for (i = 0; i < 12; i++) {
            vis.countryMonthData["" + d][i] = {
                "number": i + 1,
                "date": vis.getMonthDate.parse(i + 1 + "-2015"),
                "fatalities": {
                    "battles": 0,
                    "riots": 0,
                    "civilViolence": 0,
                    "remoteViolence": 0,
                    "all" : 0
                },
                "conflicts": {
                    "battles": 0,
                    "riots": 0,
                    "civilViolence": 0,
                    "remoteViolence": 0,
                    "all" : 0
                }
            };
            if(i==0) {
                vis.countryYearData["" + d] = {
                    "fatalities": {
                        "battles": 0,
                        "riots": 0,
                        "civilViolence": 0,
                        "remoteViolence": 0,
                        "all" : 0
                    },
                    "conflicts": {
                        "battles": 0,
                        "riots": 0,
                        "civilViolence": 0,
                        "remoteViolence": 0,
                        "all" : 0
                    }
                };
            }
        }
    });



    // get  monthly data
    vis.data.forEach(function (d) {
        if(d.COUNTRY == "Sri Lanka") {
            return;}
        vis.month = +vis.getNumberMonth(d.EVENT_DATE);

        if (d.COUNTRY == "India ")
            d.COUNTRY = "India";
        vis.countryMonthData["" + d.COUNTRY][vis.month - 1].fatalities.all += d.FATALITIES;
        vis.countryMonthData["" + d.COUNTRY][vis.month - 1].conflicts.all++;
        vis.countryYearData["" + d.COUNTRY].fatalities.all += d.FATALITIES;
        vis.countryYearData["" + d.COUNTRY].conflicts.all++;
        if(d.EVENT_TYPE == "Violence against civilians") {
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].fatalities.civilViolence += d.FATALITIES;
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].conflicts.civilViolence++;
            vis.countryYearData["" + d.COUNTRY].fatalities.civilViolence += d.FATALITIES;
            vis.countryYearData["" + d.COUNTRY].conflicts.civilViolence++;
        }
        else if(d.EVENT_TYPE == "Battle-No change of territory") {
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].fatalities.battles += d.FATALITIES;
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].conflicts.battles++;
            vis.countryYearData["" + d.COUNTRY].fatalities.battles += d.FATALITIES;
            vis.countryYearData["" + d.COUNTRY].conflicts.battles++;
        }
        else if(d.EVENT_TYPE == "Riots/Protests") {
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].fatalities.riots += d.FATALITIES;
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].conflicts.riots++;
            vis.countryYearData["" + d.COUNTRY].fatalities.riots += d.FATALITIES;
            vis.countryYearData["" + d.COUNTRY].conflicts.riots++;
        }
        else if(d.EVENT_TYPE == "Remote violence") {
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].fatalities.remoteViolence += d.FATALITIES;
            vis.countryMonthData["" + d.COUNTRY][vis.month - 1].conflicts.remoteViolence++;
            vis.countryYearData["" + d.COUNTRY].fatalities.remoteViolence += d.FATALITIES;
            vis.countryYearData["" + d.COUNTRY].conflicts.remoteViolence++;
        }
    });
    console.log(vis.countryYearData);


    $("input:checkbox[name=country]").on("click", function(){
        vis.updateChart();
    });
    $(".select-box").change(function(){
        console.log("Select!");
        vis.updateChart();
    });

    $('#view-1').click(function() {
        $(':checkbox').each(function() {
            this.checked = false;
        });
        $('#India-check').prop("checked", true);
        $('#Pakistan-check').prop("checked", true);
        $("#select-box-2").val('riots');
        $("#select-box-1").val('conflicts');
        vis.updateChart();
        vis.view1();
    });

    $('#select-all').click(function() {
        $(':checkbox').each(function() {
            this.checked = true;
        });
        vis.updateChart();
    });

    $('#select-none').click(function() {
        $(':checkbox').each(function() {
            this.checked = false;
        });
        vis.updateChart();
    });



    vis.marginBar = {top: 15, right: 100, bottom: 20, left: 40};
    vis.widthBar = 700 - vis.marginBar.left - vis.marginBar.right;
    vis.heightBar = 250 - vis.marginBar.top - vis.marginBar.bottom;
    vis.svgBar = d3.select("#bar-chart").append("svg")
        .attr("width", vis.widthBar + vis.marginBar.left + vis.marginBar.right)
        .attr("height", vis.heightBar + vis.marginBar.top + vis.marginBar.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.marginBar.left + "," + vis.marginBar.top + ")");



    // axis scales
    vis.xBar = d3.scale.ordinal()
        .rangeRoundBands([0, vis.widthBar], 0.2);
    vis.yBar = d3.scale.linear()
        .range([vis.heightBar, 0]);
    vis.xAxisBar = d3.svg.axis()
        .scale(vis.xBar)
        .orient("bottom");
    vis.yAxisBar = d3.svg.axis()
        .scale(vis.yBar)
        .orient("left");

// append axes
    vis.svgBar.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0, " + vis.heightBar + ")");
    vis.svgBar.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(0, 0)");

    vis.updateChart();

};



Linechart.prototype.view1 = function() {
    var vis = this; // read about the this

    vis.svg
        .append("text")
        .attr("class", "view")
        .attr("x", 490)
        .attr("y", 10)
        .attr("font-size", "30px")
        .attr("font-weight", "bold")
        .text("1");

    vis.svgMap
        .append("text")
        .attr("class", "view")
        .attr("x", 150)
        .attr("y", 100)
        .attr("font-size", "30px")
        .attr("font-weight", "bold")
        .text("2");

    vis.svgBar
        .append("text")
        .attr("class", "view")
        .attr("x", 270)
        .attr("y", 150)
        .attr("font-size", "30px")
        .attr("font-weight", "bold")
        .text("3");

    vis.svgView
        .append("text")
        .attr("class", "view")
        .attr("x", 0)
        .attr("y", 10)
        .text("1 - India experienced a surge in violence due to Presidential elections");

    vis.svgView
        .append("text")
        .attr("class", "view")
        .attr("x", 0)
        .attr("y", 30)
        .text("2 - Most violence occurs in the border region between Pakistan and India");

    vis.svgView
        .append("text")
        .attr("class", "view")
        .attr("x", 0)
        .attr("y", 50)
        .text("3 - India experiences far more conflict than Pakistan");

    $("svg").on("click", function(){
        d3.selectAll(".view")
            .remove();
    });

};

Linechart.prototype.initLegend = function() {
    var vis = this; // read about the this

    vis.marginLegend = {top: 0, right: 0, bottom: 0, left: 0};
    vis.widthLegend = 1100 - vis.marginLegend.left - vis.marginLegend.right;
    vis.heightLegend = 35 - vis.marginLegend.top - vis.marginLegend.bottom;
    vis.svgLegend = d3.select("#legend-top").append("svg")
        .attr("width", vis.widthLegend + vis.marginLegend.left + vis.marginLegend.right)
        .attr("height", vis.heightLegend + vis.marginLegend.top + vis.marginLegend.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.marginLegend.left + "," + vis.marginLegend.top + ")");

    vis.legendYPos = 15;
    vis.legendXPos = 60;
    vis.legendSize = 10;
    vis.legendSpace = 120;
    vis.legendcolors;
    vis.legendtext;


    // initialize legend variables
    vis.legendcolors = vis.svgLegend.selectAll("g.legendColors")
        .data(vis.allCountries, function (d) {
            return d
        });
    vis.legendtext = vis.svgLegend.selectAll("g.legendtext")
        .data(vis.allCountries, function (d) {
            return d
        });

    // append legend text and colors
    vis.legendcolors.enter()
        .append('circle')
        .attr("cx", function (d, i) {
            return (i * vis.legendSpace) + vis.legendXPos;
        })
        .attr("cy", vis.legendYPos)
        .attr("r", vis.legendSize)
        .attr("class", "legend-color")
        .attr("id", function (d) {
            return "" + d + "-legend-color"
        })
        .on('mouseover', function (d) {
            var notThisLine = $('.lines').not("#" + d + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 0.3);
            var thisLine = $("#" + d + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "5");
            var notThisBar = $('.bars').not("#" + d + "-bar");
            d3.selectAll(notThisBar)
                .style("opacity", 0.3);
            var thisBar = $("#" + d + "-bar.bars");
            d3.selectAll(thisBar)
                .style("stroke", "black");
            var cntryCircle = document.getElementById("" + d + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "black");
            d3.select("#" + d + "-map")
                .style("stroke", "black");
            d3.select("#" + d + "-bar")
                .style("stroke","black");
            d3.select("#" + d + "-bar-text")
                .style("visibility", "visible");
            d3.select("#" + d + "-chart-text")
                .style("visibility", "visible");
            d3.select("#" + d + "-legend-text")
                .style("font-weight", "bold")

        })
        .on('mouseout', function (d) {
            var notThisLine = $('.lines').not("#" + d + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 1);
            var thisLine = $("#" + d + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "2");
            var notThisBar = $('.bars').not("#" + d + "-bar");
            d3.selectAll(notThisBar)
                .style("opacity", 1);
            var thisBar = $("#" + d + "-bar.bars");
            d3.selectAll(thisBar)
                .style("stroke", "none");
            var cntryCircle = document.getElementById("" + d + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "none");
            d3.select("#" + d + "-map")
                .style("stroke", "none");
            d3.select("#" + d + "-bar")
                .style("stroke","none");
            d3.select("#" + d + "-bar-text")
                .style("visibility", "hidden");
            d3.select("#" + d + "-chart-text")
                .style("visibility", "hidden");
            d3.select("#" + d + "-legend-text")
                .style("font-weight", "normal")

        })
        .on('click', function (d) {
            $('#' + d + "-check").prop('checked', function (i, value) {
                return !value;
            });
            vis.updateChart();
        })
        .style("stroke", "none")
        .style("stroke-width", "3")
        .style("fill", function (d) {
            return vis.colors[d]
        });

    vis.legendtext.enter()
        .append("text")
        .attr("class", "legend-text")
        .attr("id", function (d) {
            return "" + d + "-legend-text"
        })
        .attr("x", function (d, i) {
            return (i * vis.legendSpace) + vis.legendXPos + vis.legendSize + 3;
        })
        .attr("y", function () {
            return vis.legendYPos + vis.legendSize/2
        })
        .on('mouseover', function (d) {
            var notThisLine = $('.lines').not("#" + d + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 0.3);
            var thisLine = $("#" + d + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "5");

            var notThisBar = $('.bars').not("#" + d + "-bar");
            d3.selectAll(notThisBar)
                .style("opacity", 0.3);
            d3.select("#" + d + "-bar")
                .style("stroke","black");
            var cntryCircle = document.getElementById("" + d + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "black");
            d3.select("#" + d + "-map")
                .style("stroke", "black");
            d3.select("#" + d + "-bar-text")
                .style("visibility", "visible");
            d3.select("#" + d + "-chart-text")
                .style("visibility", "visible");
            d3.select(this)
                .style("font-weight", "bold")

        })
        .on('mouseout', function (d) {
            var notThisLine = $('.lines').not("#" + d + "-line");
            d3.selectAll(notThisLine)
                .style("opacity", 1);
            var thisLine = $("#" + d + "-line.lines");
            d3.selectAll(thisLine)
                .style("stroke-width", "2");
            d3.select("#" + d + "-bar")
                .style("stroke","none");
            var notThisBar = $('.bars').not("#" + d + "-bar");
            d3.selectAll(notThisBar)
                .style("opacity", 1);
            var cntryCircle = document.getElementById("" + d + "-legend-color");
            d3.select(cntryCircle)
                .style("stroke", "none");
            d3.select("#" + d + "-map")
                .style("stroke", "none");
            d3.select("#" + d + "-bar-text")
                .style("visibility", "hidden");
            d3.select("#" + d + "-chart-text")
                .style("visibility", "hidden");
            d3.select(this)
                .style("font-weight", "normal")

        })
        .on('click', function (d) {
            $('#' + d + "-check").prop('checked', function (i, value) {
                return !value;
            });
            vis.updateChart();
        })
        .text(function (d) {
            return d
        });
};





