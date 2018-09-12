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
  const y = [minY, maxY];
  return { x, y };
}

function findClosestValue(x, values, xScale) {
  let closest = parseFloat(values[0]);
  values.forEach(value => {
    const valueX = xScale(parseDate(value));
    if (valueX <= x) {
      closest = parseValue(value);
    }
  });
  return closest;
}

function drawTooltip(svg, datapoints, height, width, xScale) {
  const marker = svg
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0)
    .style("stroke", "orange")
    .style("stroke-width", "2");
  const metricLabel = svg.append("text");
  const predictLabel = svg.append("text");
  const clearTip = () => {
    marker.attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 0);
    metricLabel.text("");
    predictLabel.text("");
  };

  svg.on("mousemove", d => {
    const { clientX } = d3.event;
    const x = clientX - margin.left * 2;
    const y = height;
    if (x < margin.left) {
      clearTip();
      return;
    }
    marker.attr("x1", x).attr("y1", 0).attr("x2", x).attr("y2", y);

    const metricValue = findClosestValue(x, datapoints.metric.values, xScale);
    const predictKey = Object.keys(datapoints).find(k => k !== "metric");
    const predictValue = findClosestValue(
      x,
      datapoints[predictKey].values,
      xScale
    );

    metricLabel.text(`value: $${metricValue.toFixed(2)}`).attr("y", y / 2);
    predictLabel
      .text(`predicted: $${predictValue.toFixed(2)}`)
      .attr("y", 20 + y / 2);

    if (x > width / 2) {
      metricLabel.attr("x", x - 10).style("text-anchor", "end");
      predictLabel.attr("x", x - 10).style("text-anchor", "end");
    } else {
      metricLabel.attr("x", x + 10).style("text-anchor", "start");
      predictLabel.attr("x", x + 10).style("text-anchor", "start");
    }
  });
  svg.on("mouseout", d => {
    clearTip();
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
  ["60m", "30m", "15m", "5m", "metric"].forEach(k => {
    if (!datapoints.hasOwnProperty(k)) {
      return;
    }

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
      .style("stroke", seriesColors[k] || "black")
      .style("stroke-width", k === "metric" ? "3" : "2");
  });

  drawTooltip(svg, datapoints, height, width, xScale);
}

export default class Chart extends Component {
  constructor(props) {
    super(props);
    this.state = { height: 0, width: 0 };
  }

  componentDidMount() {
    const width = this.box.getBoundingClientRect().width;
    const height = Math.min(width * (1 / 3), 400);
    drawChart(this.box, this.props.datapoints, height, width);
    this.setState({ height, width });
  }

  render() {
    const style = { height: `${this.state.height}px` };
    return <ChartBox innerRef={el => this.box = el} style={style} />;
  }
}
