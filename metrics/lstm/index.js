const tf = require("@tensorflow/tfjs");
const fetch = require("node-fetch");
const fs = require("fs");
const _ = require("lodash");
const io = require("./io");
const promCon = process.env.hasOwnProperty("PROMCON")
  ? process.env["PROMCON"]
  : "prom.predictatron.net:9090";
const backSteps = 25;
const stepDuration = 60;
const targets = ["btc_usd", "bch_usd", "eth_usd"];
const futureDurations = [5, 15, 30, 60, 360];
const models = {};
const modelParams = {};

function getScale(data) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const scale = 1 / range;
  const scaleMin = 0 - min * scale;
  return {
    min,
    max,
    range,
    scale,
    scaleMin
  };
}

async function promRange(query, start, end, step) {
  const e = encodeURIComponent;
  const res = await fetch(
    `http://${promCon}/api/v1/query_range?query=${e(query)}&start=${e(start.toISOString())}&end=${e(end.toISOString())}&step=${e(step)}`
  );
  const json = await res.json();
  return json;
}

async function querySeries() {
  const now = new Date();
  const then = new Date(Date.now() - backSteps * (2 * stepDuration) * 1000);
  const features = _.map(targets, target => target.replace("_usd", ""));
  const result = await promRange(
    `sum({__name__=~"^(${features.join("|")})_.+"}) by (__name__)`,
    then,
    now,
    stepDuration
  );

  if (result.status !== "success") {
    throw new Error(`prom query failed: ${result.status}`);
  }

  return _.reduce(
    result.data.result,
    (acc, series) => {
      const parsed = _.map(series.values, val => parseFloat(val[1]));
      const scale = getScale(parsed);
      acc[series.metric.__name__] = {
        normalized: _.map(parsed, x => x * scale.scale + scale.scaleMin),
        scale
      };
      return acc;
    },
    {}
  );
}

function seriesTensor(series, params) {
  const data = _.map(params.columns, col => series[col].normalized);
  let steps = [];
  for (let i = backSteps; i > 0; i--) {
    steps = steps.concat(_.map(data, x => x[x.length - i]));
  }
  return tf.tensor3d([[steps]], null, "float32");
}

async function predictDuration(target, series, duration) {
  const modelKey = `model-${target}-${duration}m`;
  const modelPath = `./models/${modelKey}`;
  let model = models[modelKey];
  let params = modelParams[modelKey];
  if (!model && fs.existsSync(modelPath)) {
    model = await tf.loadModel(new io.FileSystem(`${modelPath}/model.json`));
    models[modelKey] = model;
    params = JSON.parse(fs.readFileSync(`${modelPath}/params.json`, "utf8"));
    modelParams[modelKey] = params;
  }

  if (model) {
    const input = seriesTensor(series, params);
    const prediction = model.predict(input).dataSync();
    const scale = series[target].scale;
    return {
      target,
      duration,
      value: (prediction - scale.scaleMin) / scale.scale
    };
  }

  return {
    target,
    duration,
    value: 0
  };
}

async function predictTarget(target, series) {
  return Promise.all(
    _.map(futureDurations, duration =>
      predictDuration(target, series, duration)
    )
  );
}

async function predict(target) {
  const series = await querySeries();
  const activeTargets = target ? [target] : targets;
  return Promise.all(
    _.map(activeTargets, target => predictTarget(target, series))
  ).then(results => {
    return _.reduce(results, (acc, result) => acc.concat(result), []);
  });
}

async function metrics(target) {
  const predictions = await predict(target);
  const helpMetrics = {};
  const metrics = _.map(predictions, p => {
    const metric = `predict_lstm:${p.target}`;
    const series = `${metric}{predict_duration="${p.duration}"}`;
    let value = `${series} ${p.value}`;
    if (!helpMetrics.hasOwnProperty(metric)) {
      helpMetrics[metric] = true;
      value = `# HELP ${metric} lstm prediction\n# TYPE ${metric} gauge\n${value}`;
    }

    return value;
  });

  return metrics.join("\n") + "\n";
}

async function logMetrics() {
  const m = await metrics();
  console.log(m);
}

exports.lstm = async (req, res) => {
  res.setHeader("content-type", "text/plain");
  const target = req.query.target ? req.query.target : "btc_usd";
  const m = await metrics(target);
  res.send(m);
};
