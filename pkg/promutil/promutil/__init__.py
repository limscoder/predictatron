import os
import json
import logging
from urllib import parse, request

def prom_instant(q):
  params = {'query': q}
  url = 'http://{}/api/v1/query?{}'.format(os.environ['PROMCON'], parse.urlencode(params))
  logging.info('prom instant query: {}'.format(url))
  with request.urlopen(url) as resp:
    return json.loads(resp.read())

def prom_range(q, start, end, step=10):
  params = {
    'query': q,
    'start': start.isoformat() + 'Z',
    'end': end.isoformat() + 'Z',
    'step': str(step)
  }
  url = 'http://{}/api/v1/query_range?{}'.format(os.environ['PROMCON'], parse.urlencode(params))
  logging.info('prom range query: {}'.format(url))
  with request.urlopen(url) as resp:
    return json.loads(resp.read())

def prom_series(m):
  labels = []
  for k, v in m.items():
    if k != '__name__':
      labels.append('{}="{}"'.format(k, v))
  return '{}{{{}}}'.format(m['__name__'], ','.join(labels))
