from flask import Response
from datetime import datetime, timedelta
from prometheus_client import CollectorRegistry, Gauge, generate_latest
import pandas as pd
import logging
import math
from statsmodels.tsa.arima_model import ARIMA
from promutil import prom_range, prom_series

durations = [
  {'future': 5},
  {'future': 15},
  {'future': 30},
  {'future': 60},
  {'future': 360}]

def arima(request):
  """
  Arima prediction endpoint
  """

  exposition = []
  history_duration = 60 * 60 * 24
  end = datetime.now()
  start = end - timedelta(seconds=history_duration)
  metrics = prom_range('{predict_arima="true"}', start, end, 60)['data']['result']
  for metric in metrics:
    m = metric['metric']
    n = 'predict_arima:{}'.format(m['__name__'])
    exposition.append('# HELP {} arima prediction'.format(n))
    exposition.append('# TYPE {} gauge'.format(n))

    # format data
    vals = metric['values']
    data = {
      'timestamp': [datetime.fromtimestamp(val[0]) for val in vals],
      'value': [float(val[1]) for val in vals],
    }
    df = pd.DataFrame(data)
    logging.info('arima fitting {} series values with types {}, {}'.format(len(vals), df.dtypes.get('timestamp'), df.dtypes.get('value')))
    series = df.set_index('timestamp')

    # fit arima model
    try:
      model = ARIMA(series, order=(3,1,0), freq='T')
      model_fit = model.fit(disp=0)
      step_duration = history_duration / len(vals)
      max_step = math.ceil((durations[-1]['future'] * 60) / step_duration) + 1
      forecast = model_fit.forecast(steps=max_step)

      # expose forecasts    
      for duration in durations:
        future = duration['future']
        forecast_idx = math.ceil((future * 60) / step_duration)
        prediction = forecast[0][forecast_idx]

        p = {'__name__': n, 'predict_duration': str(future)}
        for k, v in m.items():
          if k != '__name__' and not k.startswith('predict') and k != 'job':
            p[k] = v
        exposition.append('{} {}'.format(prom_series(p), prediction))
    except Exception as e:
      logging.warn("arima fit failed: {}".format(str(e)))

  return Response('\n'.join(exposition) + '\n', mimetype="text/plain")