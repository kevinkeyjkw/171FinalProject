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
Timeline.prototype.moveTicker = function(d){
    var vis = this;
    vis.ticker.select("line.tickerline").transition();
    vis.ticker.select("line.tickerline").remove();
    // ticker for timeline
    vis.ticker.append("line")
        .attr("class", "tickerline")
        .style("stroke", "black")
        .attr("y1", 0)
        .attr("y2", vis.height);

    vis.ticker.style("display", null);
    vis.ticker.select("line.tickerline")
        .attr("transform",
            "translate(" + vis.x(d) + ",0)")
        .transition().duration((365 - d.getMonth()*30 - d.getDate()) * dayDelay * 1000)
        .ease("linear")
        .attr("transform",
            "translate(" + vis.timelineWidth + ",0)");
}
Timeline.prototype.initVis = function(){
    var vis = this; // read about the this
    var extraWidth = 50, extraHeight = 15;
    vis.margin = {top: 0, right: 0, bottom: 30, left: 60};

    vis.width = 900 - vis.margin.left - vis.margin.right,
        vis.height = 200 - vis.margin.top - vis.margin.bottom;
    vis.keysToDates = Object.keys(vis.displayData).map(function(d){return new Date(+d);});
    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right+extraWidth)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom+extraHeight)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
        .attr("width", vis.width + vis.margin.left + vis.margin.right-200)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);


    vis.timelineWidth = vis.width - extraWidth;
    vis.dateFormat = d3.time.format("%Y-%m-%d");
    // Scales and axes
    vis.x = d3.time.scale()
        .range([0, vis.timelineWidth])
        .domain(d3.extent(vis.keysToDates));

    //console.log(vis.x.domain(), vis.x.range());


    vis.y = d3.scale.linear()
        .range([vis.height, extraHeight])
        .domain([0,d3.max(Object.keys(vis.displayData), function(d){
            return vis.displayData[d];
        })]);


    //console.log(vis.y.domain(), vis.y.range());
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

    vis.svg.on("click", function(){
        //console.log("SVG click!");
        var path = vis.svg.select("path").node();
        new_click_event = new Event('click');
        new_click_event.pageX = d3.event.pageX;
        new_click_event.clientX = d3.event.clientX;
        new_click_event.pageY = d3.event.pageY;
        new_click_event.clientY = d3.event.clientY;
        path.dispatchEvent(new_click_event);
    }).on('mousedown', function(){
        //console.log("Down!");
        //brush_elm = vis.svg.select(".brush").node();
        //new_click_event = new Event('mousedown');
        //new_click_event.pageX = d3.event.pageX;
        //new_click_event.clientX = d3.event.clientX;
        //new_click_event.pageY = d3.event.pageY;
        //new_click_event.clientY = d3.event.clientY;
        //brush_elm.dispatchEvent(new_click_event);
    });

    vis.svg.append("path")
        .datum(Object.keys(vis.displayData))
        .attr("fill", "#b21018")
        .attr("d", vis.area)
        //.attr("width", 300)
        .style("pointer-events", "fill")
        .on("mouseover", function(){
            vis.focus.style("display", null);
            vis.focusText.style("display", null);
        }).on("mouseout", function(){
            vis.focus.style("display", "none");
            vis.focusText.style("display", "none");
        }).on("mousemove", mousemove)
        .on("click", mouseclick)
        .on('mousedown', function(){
            console.log("No down!");
            //brush_elm = vis.svg.select(".brush").node();
            //new_click_event = new Event('mousedown');
            //new_click_event.pageX = d3.event.pageX;
            //new_click_event.clientX = d3.event.clientX;
            //new_click_event.pageY = d3.event.pageY;
            //new_click_event.clientY = d3.event.clientY;
            //brush_elm.dispatchEvent(new_click_event);
        })
        ;

    // append axis
    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .attr("width", vis.width+100)
        .call(vis.xAxis);
        //.call(vis.yAxis);

    // append circle on mouse hover
    vis.focus = vis.svg.append("g")
        .style("display", "none")
        .attr("class", "focus");

    vis.focusText = vis.svg.append("g")
        .style("display", "none")
        .attr("class", "focus");

    // group element for timeline ticker
    vis.ticker = vis.svg.append("g")
        .style("display", "none")
        .attr("class", "ticker");

    vis.focus.append("circle")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "#0a0840")
        .attr("r", 2);

    // hairline follows mouse
    vis.focus.append("line")
        .attr("class", "x")
        .style("stroke", "black")
        .attr("y1", 0)
        .attr("y2", vis.height);

    // append rectangle to capture mouse hover
    vis.svg.append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .style("fill", "none")
        .on("click", mouseclick);

    /* Fatalities Text */
    vis.focusText.append("text")
        .attr("class", "y1")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .style("font-weight", "bold")
        .style("z-index", 100)
        .attr("dx", 8)
        .attr("dy", "-.3em");
    vis.focusText.append("text")
        .attr("class", "y2")
        .style("font-weight", "bold")
        .style("z-index", 100)
        .attr("dx", 8)
        .attr("dy", "-.3em");

    /* Date Text */
    vis.focusText.append("text")
        .attr("class", "y3")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "1em");
    vis.focusText.append("text")
        .attr("class", "y4")
        .attr("dx", 8)
        .attr("dy", "1em")
        .style("fill", "black");



    vis.bisectDate = d3.bisector(function(d) { return d; }).left;

    function mouseclick(){
        //console.log("Click!");
        var x0 = vis.x.invert(d3.mouse(this)[0]),
            i = vis.bisectDate(vis.keysToDates, x0);
        var d0 = vis.keysToDates[i-1],
            d1 = vis.keysToDates[i],
            d = x0 - d0 > d1 - x0 ? d1: d0;

        // Play time lapse starting from d
        // Filter depending on date
        var features = cleanedDataFeatures.filter(function(x) {
            return x.properties.date > d;
        });


        // Filter by checkbox
        var filteredFeatures = filterCheckboxes(features);
        if(filteredFeatures.length == 0){
            alert("Select at least one conflict type");
            return;
        }
        // Filter by country
        filteredFeatures = filterCountry(filteredFeatures);
        if(filteredFeatures.length == 0){
            alert("Select at least one country");
            return;
        }
        var filteredCities = convertToFeatures(
            filteredFeatures
            );

        stop();
        // Time lapse on map
        addlocations(filteredCities, d);

        // Move a black vertical line along timeline
        vis.moveTicker(d);

    }

    function mousemove(){
        var x0 = vis.x.invert(d3.mouse(this)[0]),
            i = vis.bisectDate(vis.keysToDates, x0);
            //console.log(i);
            var d0 = vis.keysToDates[i-1],
            d1 = vis.keysToDates[i],
            d = x0 - d0 > d1 - x0 ? d1: d0;
        //console.log(vis.x(d),vis.y(vis.displayData[d.getTime().toString()]),d.getTime().toString(),vis.displayData[d.getTime().toString()]);

        // move circle, hairline to mouse's position
        vis.focus.select("circle.y")
            .attr("transform",
            "translate("+vis.x(d)+","+vis.y(vis.displayData[d.getTime().toString()])+")");

        vis.focus.select("line.x")
            .attr("transform",
            "translate("+vis.x(d)+",0)")
            .attr("y1", vis.y(vis.displayData[d.getTime().toString()]));

        /* Fatalities */
        vis.focusText.select("text.y1")
            .attr("transform", "translate(" + vis.x(d) + "," +
                vis.y(vis.displayData[d.getTime().toString()]) + ")")
            .text(vis.displayData[d.getTime().toString()]+ " Fatalities");
        vis.focusText.select("text.y2")
            .attr("transform", "translate(" + vis.x(d) + "," +
                vis.y(vis.displayData[d.getTime().toString()]) + ")")
            .text(vis.displayData[d.getTime().toString()]+ " Fatalities");

        // Date text
        vis.focusText.select("text.y3")
            .attr("transform", "translate(" + vis.x(d) + "," +
                vis.y(vis.displayData[d.getTime().toString()]) + ")")
            .text(vis.dateFormat(d));
        vis.focusText.select("text.y4")
            .attr("transform", "translate(" + vis.x(d) + "," +
                vis.y(vis.displayData[d.getTime().toString()]) + ")")
            .text(vis.dateFormat(d));

    }
}







