"""fetches historical data from prometheus"""

import os
import json
import logging
import csv
from urllib import parse, request
from datetime import datetime, timedelta
from promutil import prom_range, prom_series

if __name__ == "__main__":
  end = datetime.now()
  start = end - timedelta(weeks=1)
  query = 'sum({__name__=~"^(btc|eth|bch)_.+"}) by (__name__)'

  results = prom_range(query, start, end, 60)['data']['result']
  metrics = []
  datapoints = {}
  for series in results:
    key = series['metric']['__name__']
    metrics.append(key)
    for val in series['values']:
      ts = val[0]
      if ts not in datapoints:
        datapoints[ts] = {}
      datapoints[ts][key] = float(val[1])

  with open('data/coins.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(["timestamp"] + metrics)
    for ts in sorted(datapoints.keys()):
      vals = datapoints[ts]
      row = [ts] + [vals.get(metric, None) for metric in metrics]
      writer.writerow(row)
