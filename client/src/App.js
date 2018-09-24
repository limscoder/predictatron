import React, { Component } from "react";
import styled from "styled-components";
import update from "immutability-helper";

import Graph from "./Graph";
import logo from "./media/robot-240w.png";

const AppBox = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px 40px;
`;
const Header = styled.header`
  align-items: center;
  display: flex;
  justify-content: center;
`;
const TitleBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Title = styled.h1`
  margin: 0 40px 0 0;
  font-family: Impact;
  font-size: 124px;
`;
const SubTitle = styled.h2`
  margin: 0;
  font-family: Courier;
  font-size: 62px;
`;

function fetchRange(
  URL,
  query,
  target,
  duration = 60 * 60 * 3 * 1000,
  offset = 0,
  step = 10
) {
  const now = new Date().toISOString();
  const then = new Date(Date.now() - duration - offset).toISOString();
  const e = encodeURIComponent;
  const req = new Request(
    `${URL}/api/v1/query_range?query=${e(query)}&start=${e(then)}&end=${e(now)}&step=${e(step)}`
  );
  return fetch(req, {
    method: "GET",
    mode: "cors",
    cache: "no-cache"
  })
    .then(resp => resp.json())
    .then(content => {
      content.target = target;
      if (content.status === "success" && offset) {
        const offsetSeconds = offset / 1000;
        content.data.result = content.data.result.map(result => {
          return {
            ...result,
            values: result.values.reduce((acc, value) => {
              const y = value[1];
              if (y !== null && !isNaN(y) && typeof y !== "undefined") {
                acc.push([value[0] + offsetSeconds, y]);
              }
              return acc;
            }, [])
          };
        });
      }

      return content;
    });
}

function groupDatapoints(queries) {
  return queries.reduce((acc, query) => {
    if (query.status === "success") {
      const result = query.data.result;
      if (result.length !== 1) {
        console.warn(result);
        throw new Error(`unexpected series count: ${result.length}`);
      }
      acc[query.target] = result[0];
    }

    return acc;
  }, {});
}

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      graphs: [
        {
          defaults: {
            promURL: "http://prom.predictatron.net:9090",
            predictMetric: "btc_usd",
            predictMethod: "predict_linear",
            predictPast: "43200",
            predictFuture: "15m"
          }
        }
      ]
    };
  }

  componentDidMount() {
    this.state.graphs.forEach((graph, idx) =>
      this.onExecute(graph.defaults, idx)
    );
  }

  render() {
    const graphs = this.state.graphs.map((graphData, idx) => {
      return (
        <Graph
          key={idx}
          graphData={graphData}
          onDuplicate={formData => this.onDuplicate(formData, idx)}
          onExecute={formData => this.onExecute(formData, idx)}
        />
      );
    });

    return (
      <AppBox>
        <Header>
          <TitleBox>
            <Title>predictatron</Title>
            <SubTitle>3000</SubTitle>
          </TitleBox>
          <img src={logo} alt="logo" />
        </Header>
        {graphs}
      </AppBox>
    );
  }

  onDuplicate(formData, graphIdx) {
    const insertIdx = graphIdx + 1;
    const inserted = this.state.graphs.slice(0, this.state.graphs.length);
    inserted.splice(insertIdx, 0, { defaults: formData });
    this.setState({ graphs: inserted }, () =>
      this.onExecute(formData, insertIdx)
    );
  }

  onExecute(formData, graphIdx) {
    this.setState(
      update(this.state, {
        graphs: {
          [graphIdx]: {
            datapoints: { $set: false },
            defaults: { $set: formData }
          }
        }
      })
    );

    const {
      promURL,
      predictMetric,
      predictMethod,
      predictFuture,
      predictPast
    } = formData;
    const duration = parseInt(predictPast, 10) * 1000;
    const futureMinutes = predictFuture.substr(0, predictFuture.length - 1);
    const futureSeconds = parseInt(futureMinutes, 10) * 60;
    const predictQuery = `${predictMethod}:${predictMetric}{predict_duration="${futureMinutes}"}`;

    Promise.all([
      fetchRange(promURL, predictMetric, "metric", duration),
      fetchRange(
        promURL,
        predictQuery,
        predictFuture,
        duration,
        futureSeconds * 1000
      )
    ]).then(content => {
      const datapoints = groupDatapoints(content);
      this.setState(
        update(this.state, {
          graphs: { [graphIdx]: { datapoints: { $set: datapoints } } }
        })
      );
    });
  }
}
