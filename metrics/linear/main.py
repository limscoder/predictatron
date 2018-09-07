from flask import Response
from prometheus_client import CollectorRegistry, Gauge, generate_latest
from promutil import prom_instant, prom_series

durations = [5, 15, 15, 30, 60]

def linear(request):
  """
  Coin linear prediction endpoint
  """

  exposition = []
  metrics = prom_instant('{predict_linear="true"}')['data']['result']
  for metric in metrics:
    m = metric['metric']
    s = prom_series(m)
    n = 'predict_linear:{}'.format(m['__name__'])
    exposition.append('# HELP {} linear prediction'.format(n))
    exposition.append('# TYPE {} gauge'.format(n))

    for duration in durations:
      predicted = prom_instant('predict_linear({}[24h], {})'.format(s, duration * 60))['data']['result'][0]
      p = {'__name__': n, 'predict_duration': str(duration)}
      for k, v in m.items():
        if k != '__name__' and not k.startswith('predict'):
          p[k] = v
      exposition.append('{} {}'.format(prom_series(p), predicted['value'][1]))

  return Response('\n'.join(exposition) + '\n', mimetype="text/plain")