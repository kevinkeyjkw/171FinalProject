/**
 * Created by Kevin on 4/25/16.
 */
Barchart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.Alldata = _data;

    // Sort data by date

    this.initVis();
}

Barchart.prototype.updateVisualization = function(){
    var vis = this;
    vis.svg.selectAll("rect.bar").remove();
    var users = document.getElementById("y-type");

    vis.selection = users.options[users.selectedIndex].value;


    // create a matrix for stacked chart
    vis.display = d3.range(vis.selectCountries.length).map(function() { return d3.range(vis.conflictNames.length).map(Math.random).map(Math.floor); });

    max=0;
    if (vis.selection=="Fatalities") {
        vis.Alldata.forEach(function (d) {
            if (d.COUNTRY in vis.countryDic && d.EVENT_TYPE in vis.conflictDic) {
                vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]] += d.FATALITIES;
                if (vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]] >= max) {
                    max = vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]];
                }
            }
        });
    } else {
        vis.Alldata.forEach(function (d) {
            if (d.COUNTRY in vis.countryDic && d.EVENT_TYPE in vis.conflictDic) {
                vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]] += 1;
                if (vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]] >= max) {
                    max = vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]];
                }
            }
        });
    }
    console.log("display");
    console.log(vis.display);

    vis.data = [];
    // create array of dictionary for plotting
    for (i=0; i<vis.selectCountries.length; i++) {
        vis.data.push({
            "Battle-No change of territory": vis.display[i][0],
            "Riots/Protests": vis.display[i][1],
            "Remote violence": vis.display[i][2],
            "Violence against civilians": vis.display[i][3],
            "country": vis.selectCountries[i]
        });
    }


    vis.color.domain(d3.keys(vis.data[0]).filter(function(key) { return key !== "country"; }));

    vis.data.forEach(function(d) {
        var y0 = 0;
        d.ages = vis.color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
        d.total = d.ages[d.ages.length - 1].y1;
    });

    vis.data.sort(function(a, b) { return b.total - a.total; });

    vis.x.domain(vis.data.map(function(d) { return d.country; }));
    vis.y.domain([0, d3.max(vis.data, function(d) { return d.total; })]);

    // update axis
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.xAxisUpdate.transition()
        .duration(800).call(vis.xAxis);
    vis.yAxisUpdate.transition()
        .duration(800).call(vis.yAxis);

    vis.state = vis.svg.selectAll(".state")
        .data(vis.data)
        .enter().append("g").attr("class", "g")
        .attr("transform", function(d) { return "translate(" + vis.x(d.country) + ",0)"; })
        .selectAll("rect")
        .data(function(d) { return d.ages;});



    vis.state
        .enter()
        .append("rect")
        .attr("class", "bar");
    //.attr("transform", function(d) { return "translate(" + x(d.country) + ",0)"; });

    // Update (set the dynamic properties of the elements)
    vis.state
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide)
        .transition()
        .duration(500)
        .attr("width", vis.x.rangeBand())
        .attr("height", function(d) { return vis.y(d.y0) - vis.y(d.y1); })
        .attr("y", function(d) { return vis.y(d.y1); })
        .style("fill", function(d) { return vis.color(d.name); });


    // Exit
    vis.state.exit().remove();



    vis.legend = vis.svg.selectAll(".legend")
        .data(vis.color.domain().slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    vis.legend.append("rect")
        .attr("x", vis.width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", vis.color);

    vis.legend.append("text")
        .attr("x", vis.width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });
}

Barchart.prototype.initVis = function(){
    var vis = this; // read about the this
    vis.margin = {top: 20, right: 30, bottom: 30, left: 50},
        vis.width = 960 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;


    vis.xAxis;
    vis.yAxis;
    vis.xAxisUpdate;
    vis.yAxisUpdate;
    vis.max = 0;
    vis.display;
    vis.Alldata;

    vis.x = d3.scale.ordinal()
        .rangeRoundBands([0, vis.width], 0.3);

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    vis.color = d3.scale.ordinal()
        .range(["#98abc5", "#7b6888", "#a05d56", "#ff8c00"]);



    vis.svg = d3.select("#barchart").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    vis.dateFormat = d3.time.format("%d-%B-%Y");
    vis.conflictTypes = [];
    vis.selectCountries = ["Bangladesh", "Cambodia", "India", "Myanmar", "Nepal", "Pakistan", "Sri Lanka", "Thailand"];
    vis.countryDic = {"Bangladesh":0, "Cambodia":1, "India":2, "Myanmar":3, "Nepal":4, "Pakistan":5, "Sri Lanka":6, "Thailand":7};
    vis.conflictNames = ["Battle-No change of territory","Riots/Protests","Remote violence", "Violence against civilians"];
    vis.conflictDic = {"Battle-No change of territory":0,"Riots/Protests":1,"Remote violence":2, "Violence against civilians":3};
    vis.selection = "Conflicts";


// add tooltip
    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d, i) {
            return vis.selection +": "+ (d.y1- d.y0);
        })
        .offset([-6, 0]);
    vis.svg.call(vis.tip);

    // create a matrix for stacked chart
    vis.display = d3.range(vis.selectCountries.length).map(function() { return d3.range(vis.conflictNames.length).map(Math.random).map(Math.floor); });

    vis.Alldata.forEach(function (d) {
        if (d.COUNTRY in vis.countryDic && d.EVENT_TYPE in vis.conflictDic) {
            vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]] += 1;
            if (vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]] >= vis.max) {
                vis.max = vis.display[vis.countryDic[d.COUNTRY]][vis.conflictDic[d.EVENT_TYPE]];
            }
        }
    });

    vis.data = [];

    // create array of dictionary for plotting
    for (i=0; i<vis.selectCountries.length; i++) {
        vis.data.push({
            "Battle-No change of territory": vis.display[i][0],
            "Riots/Protests": vis.display[i][1],
            "Remote violence": vis.display[i][2],
            "Violence against civilians": vis.display[i][3],
            "country": vis.selectCountries[i]
        });
    }

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.xAxisUpdate = vis.svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    vis.yAxisUpdate = vis.svg.append("g")
        .attr("class", "y-axis")
        .call(vis.yAxis)
        .attr("transform", "rotate(0)");



    vis.updateVisualization();
}


