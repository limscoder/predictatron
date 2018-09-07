import os
import json
from urllib import parse, request

def prom_instant(q):
  params = {'query': q}
  url = 'http://{}/api/v1/query?{}'.format(os.environ['PROMCON'], parse.urlencode(params))
  with request.urlopen(url) as resp:
    return json.loads(resp.read())

def prom_series(m):
  labels = []
  for k, v in m.items():
    if k != '__name__':
      labels.append('{}="{}"'.format(k, v))
  return '{}{{{}}}'.format(m['__name__'], ','.join(labels))
