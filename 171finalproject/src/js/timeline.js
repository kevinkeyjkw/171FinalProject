/**
 * Created by Kevin on 4/22/16.
 */

/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the
 */

Timeline = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    // No data wrangling, no update sequence
    this.displayData = {};
    // Sort data by date
    var keys = Object.keys(_data).sort();
    for(var i=0;i < keys.length;i++){
        this.displayData[keys[i]] = _data[keys[i]];
    }
    console.log(this.displayData);
    this.initVis();
}


/*
 * Initialize area chart with brushing component
 */

Timeline.prototype.initVis = function(){
    var vis = this; // read about the this

    vis.margin = {top: 0, right: 0, bottom: 30, left: 60};

    vis.width = 800 - vis.margin.left - vis.margin.right,
        vis.height = 200 - vis.margin.top - vis.margin.bottom;
    vis.keysToDates = Object.keys(vis.displayData).map(function(d){return new Date(+d);});
    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.time.scale()
        .range([0, vis.width])
        .domain(d3.extent(vis.keysToDates));

    console.log(vis.x.domain(), vis.x.range());


    vis.y = d3.scale.linear()
        .range([vis.height, 0])
        .domain([0,d3.max(Object.keys(vis.displayData), function(d){
            return vis.displayData[d];
        })]);


    console.log(vis.y.domain(), vis.y.range());
        //.domain([0, d3.max(vis.displayData, function(d) { return d.FATALITIES; })]);

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .ticks(d3.time.months, 1)
        .tickFormat(d3.time.format("%b"));

    vis.brush = d3.svg.brush()
        .x(vis.x)
        .on("brush", brushed);

    // TO-DO: Append brush component here

    vis.svg.append("g")
        .attr("class", "brush")
        //.style("pointer-events", "painted")
        .call(vis.brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", vis.height+7);

    // SVG area path generator
    vis.area = d3.svg.area()
        .x(function(d) {
            //console.log('hi',vis.x(new Date(+d)));
            return vis.x(new Date(+d)); })
        .y0(vis.height)
        .y1(function(d) {
            //console.log('hi',vis.y(vis.displayData[d]));
            return vis.y(vis.displayData[d]);
        });



    vis.svg.append("path")
        .datum(Object.keys(vis.displayData))
        .attr("fill", "#b21018")
        .attr("d", vis.area)
        .style("pointer-events", "fill")
        .on("mouseover", function(){
            vis.focus.style("display", null);
        }).on("mouseout", function(){
            vis.focus.style("display", "none");
        }).on("mousemove", mousemove)
        .on('mousedown', function(){
            brush_elm = vis.svg.select(".brush").node();
            new_click_event = new Event('mousedown');
            new_click_event.pageX = d3.event.pageX;
            new_click_event.clientX = d3.event.clientX;
            new_click_event.pageY = d3.event.pageY;
            new_click_event.clientY = d3.event.clientY;
            brush_elm.dispatchEvent(new_click_event);
        });

    // append axis
    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);
        //.call(vis.yAxis);

    // append circle on mouse hover
    vis.focus = vis.svg.append("g")
        .style("display", "none")
        .attr("class", "focus");

    vis.focus.append("circle")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "#0a0840")
        .attr("r", 2);

    // append rectangle to capture mouse
    vis.svg.append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .style("fill", "none");
        //.style("pointer-events", "all");
        //.on("mouseover", function(){
        //    vis.focus.style("display", null);
        //}).on("mouseout", function(){
        //    vis.focus.style("display", "none");
        //}).on("mousemove", mousemove);


    vis.bisectDate = d3.bisector(function(d) { return d; }).left;
    function mousemove(){
        var x0 = vis.x.invert(d3.mouse(this)[0]),
            i = vis.bisectDate(vis.keysToDates, x0);
            //console.log(i);
            var d0 = vis.keysToDates[i-1],
            d1 = vis.keysToDates[i],
            d = x0 - d0 > d1 - x0 ? d1: d0;
        console.log(vis.x(d),vis.y(vis.displayData[d.getTime().toString()]),d.getTime().toString(),vis.displayData[d.getTime().toString()]);

        vis.focus.select("circle.y")
            .attr("transform",
            "translate("+vis.x(d)+","+vis.y(vis.displayData[d.getTime().toString()])+")");

    }
}





