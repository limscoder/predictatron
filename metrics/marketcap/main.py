from flask import Response
from coinmarketcap import Market
from prometheus_client import CollectorRegistry, Gauge, generate_latest
from ticker import tickers

def marketcap(request):
  """
  Metrics endpoint
  """

  registry = CollectorRegistry()
  market = Market()

  for ticker in tickers:
    t = ticker['ticker']
    T = t.upper()
    data = market.ticker(ticker['marketcap_id'], convert='USD')['data']
    g = Gauge('{}_supply'.format(t), '{} supply'.format(T), registry=registry)
    g.set(data['total_supply'])

    usd = data['quotes']['USD']
    g = Gauge('{}_usd'.format(t), '{}/USD price'.format(T), registry=registry)
    g.set(usd['price'])
    g = Gauge('{}_vol'.format(t), '{} volume'.format(T), registry=registry)
    g.set(usd['volume_24h'])

  return Response(generate_latest(registry), mimetype="text/plain")