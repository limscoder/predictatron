from flask import Response
from prometheus_client import CollectorRegistry, Gauge, generate_latest
from promutil import prom_instant, prom_series

durations = [
  {'future': 5, 'past': 60},
  {'future': 15, 'past': 120},
  {'future': 30, 'past': 360},
  {'future': 60, 'past': 720},
  {'future': 360, 'past': 1440}]

def linear(request):
  """
  Linear prediction endpoint
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
      predicted = prom_instant('predict_linear({}[{}m], {})'.format(s, duration['past'], duration['future'] * 60))['data']['result'][0]
      p = {'__name__': n, 'predict_duration': str(duration['future'])}
      for k, v in m.items():
        if k != '__name__' and not k.startswith('predict') and k != 'job':
          p[k] = v
      exposition.append('{} {}'.format(prom_series(p), predicted['value'][1]))

  return Response('\n'.join(exposition) + '\n', mimetype="text/plain")