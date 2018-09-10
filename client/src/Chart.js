import React, { Component } from "react";
import styled from "styled-components";
import * as d3 from "d3";

const ChartBox = styled.div`
  margin: 20px 0;
`;

const seriesColors = {
  metric: "#58F4CD"
};

// const margin = 5;
const margin = {
  top: 5,
  bottom: 20,
  left: 40,
  right: 5
};

function parseDate(d) {
  return new Date(d[0] * 1000);
}

function parseValue(d) {
  return parseFloat(d[1]);
}

function getDomains(datapoints, height, width) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  Object.values(datapoints).forEach(d => {
    d.values.forEach(v => {
      const x = v[0];
      if (x < minX) {
        minX = x;
      }
      if (x > maxX) {
        maxX = x;
      }

      const y = parseValue(v);
      if (y < minY) {
        minY = y;
      }
      if (y > maxY) {
        maxY = y;
      }
    });
  });

  const x = [new Date(minX * 1000), new Date(maxX * 1000)];
  const y = [maxY, minY];
  return { x, y };
}

function drawTooltip(svg, datapoints, xScale, yScale) {
  const tip = d3
    .select("body")
    .append("div")
    .html("hey bro!")
    .style("display", "none")
    .style("position", "absolute");

  svg.on("mouseover", d => {
    // find nearest datapoints!

    tip
      .style("display", "block")
      .style("left", d3.event.pageX + 30 + "px")
      .style("top", d3.event.pageY - 30 + "px");
  });
  svg.on("mouseout", d => {
    tip.style("display", "none");
  });
}

function drawAxis(svg, xScale, yScale, height, width) {
  const axisGroup = svg.append("g");

  axisGroup
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickSize(-height + margin.top + margin.bottom))
    .style("fill", "#f4f4f4");

  axisGroup
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right));

  axisGroup
    .selectAll("path")
    .style("stroke", "white")
    .style("stroke-width", "2");
  axisGroup
    .selectAll("line")
    .style("stroke", "white")
    .style("stroke-width", "2");
}

function drawChart(el, datapoints, height, width) {
  const svg = d3
    .select(el)
    .append("svg")
    .attr("height", height)
    .attr("width", width);

  const domains = getDomains(datapoints);
  const xScale = d3
    .scaleTime()
    .range([margin.left, width - margin.right])
    .domain(domains.x);
  const yScale = d3
    .scaleLinear()
    .range([height - margin.bottom, margin.top])
    .domain(domains.y);
  drawAxis(svg, xScale, yScale, height, width);

  const lineGroup = svg.append("g");
  Object.keys(datapoints).forEach(k => {
    const line = d3
      .line()
      .curve(d3.curveBasis)
      .x(d => xScale(parseDate(d)))
      .y(d => yScale(parseValue(d)));

    lineGroup
      .append("g")
      .append("path")
      .attr("d", line(datapoints[k].values))
      .style("fill", "none")
      .style("stroke", seriesColors[k])
      .style("stroke-width", k === "metric" ? "3" : "1");
  });

  // drawTooltip(svg, datapoints, xScale, yScale);
}

export default class Chart extends Component {
  constructor(props) {
    super(props);
    this.state = { height: 0, width: 0 };
  }

  componentDidMount() {
    const width = this.box.getBoundingClientRect().width;
    const height = width * (1 / 3);
    drawChart(this.box, this.props.datapoints, height, width);
    this.setState({ height, width });
  }

  render() {
    const style = { height: `${this.state.height}px` };
    return <ChartBox innerRef={el => this.box = el} style={style} />;
  }
}
