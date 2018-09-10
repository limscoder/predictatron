import React, { Component } from "react";
import styled from "styled-components";
import Form from "./Form";
import Chart from "./Chart";

const GraphBox = styled.div`
  margin: 20px 40px;
`;
const LoadingBox = styled.div`
  margin: 20px 0;
  font-family: Helvetica;
  font-size: 24px;
`;

export default class Graph extends Component {
  render() {
    const form = <Form onExecute={this.props.onExecute} />;

    let chart;
    const datapoints = this.props.graphData.datapoints;
    if (typeof datapoints !== "undefined") {
      if (datapoints === false) {
        chart = <LoadingBox>loading...</LoadingBox>;
      } else if (Object.keys(datapoints).length) {
        chart = <Chart datapoints={datapoints} />;
      }
    }

    return <GraphBox>{form}{chart}</GraphBox>;
  }
}
