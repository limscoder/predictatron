"""trains lstm model on coin data"""

# adapted from -- https://machinelearningmastery.com/multivariate-time-series-forecasting-lstms-keras/

from pandas import DataFrame, concat, read_csv
from sklearn.preprocessing import MinMaxScaler
from keras.models import Sequential
from keras.layers import Dense
from keras.layers import LSTM
from keras import backend
from matplotlib import pyplot
import tensorflow as tf
import tensorflowjs as tfjs
import json

def timesteps_as_features(data, columns, n_in=1, n_out=1, dropnan=True):
	n_vars = 1 if type(data) is list else data.shape[1]
	df = DataFrame(data)
	cols, names = list(), list()
	# input sequence (t-n, ... t-1)
	for i in range(n_in, 0, -1):
		cols.append(df.shift(i))
		names += [('x:%s(t-%d)' % (columns[j], i)) for j in range(n_vars)]
	# forecast sequence (t, t+1, ... t+n)
	for i in range(0, n_out):
		cols.append(df.shift(-i))
		names += [('y:%s(t+%d)' % (columns[j], i)) for j in range(n_vars)]
	# put it all together
	agg = concat(cols, axis=1)
	agg.columns = names
	# drop rows with NaN values
	if dropnan:
		agg.dropna(inplace=True)
	return agg

def load_data(predict='btc_usd', in_steps=1, out_steps=1):
  # parse data
  dataset = read_csv('data/coins.csv', header=0, index_col=0)

  # find prediction target
  target_col = -1
  for idx, col in enumerate(dataset.columns):
    if col == predict:
      target_col = idx
      break
  if target_col < 0:
    raise Exception("invalid prediction column")

  # validate that all data are floats, labeled columns need to be encoded
  values = dataset.values
  values = values.astype('float32')

  # normalize features
  scaler = MinMaxScaler(feature_range=(0, 1))
  scaled = scaler.fit_transform(values)

  # generate previous steps as new columns and strip current feature values
  y_col = '{}(t+{})'.format(predict, out_steps - 1)
  def include_feature(x):
    parts = x.split(':')
    if parts[0] == 'y' and not parts[1].startswith(y_col):
      return False
    return True

  sequenced = timesteps_as_features(scaled, dataset.columns, in_steps, out_steps)
  drop_cols = [idx for idx, x in enumerate(sequenced.columns) if not include_feature(x)]
  sequenced.drop(sequenced.columns[drop_cols], axis=1, inplace=True)
  return sequenced

def split_data(data, test_ratio=0.25):
  # split into train and test sets
  values = data.values
  n_train = int(len(values) * (1 - test_ratio))
  train = values[:n_train, :]
  test = values[n_train:, :]
  # split into input and outputs
  train_X, train_y = train[:, :-1], train[:, -1]
  test_X, test_y = test[:, :-1], test[:, -1]
  # reshape input to be 3D [samples, timesteps, features]
  train_X = train_X.reshape((train_X.shape[0], 1, train_X.shape[1]))
  test_X = test_X.reshape((test_X.shape[0], 1, test_X.shape[1]))
  return {"train_X": train_X, "test_X": test_X, "train_y": train_y, "test_y": test_y}

def compile(data, layer_size):
  model = Sequential()
  model.add(LSTM(layer_size, input_shape=(data['train_X'].shape[1], data['train_X'].shape[2]), name="predictatronInput"))
  model.add(Dense(1, activation='sigmoid', name="predictatronOutput"))
  model.compile(loss='mae', optimizer='adam')
  return model

def plot(history):
  pyplot.plot(history.history['loss'], label='train')
  pyplot.plot(history.history['val_loss'], label='test')
  pyplot.legend()
  pyplot.show()

def train(target, future, graph=False):  
  in_step=25
  out_step=future
  data = load_data(target, in_step, out_step)
  sets = split_data(data)

  # train model
  model = compile(sets, 100)
  history = model.fit(
    sets['train_X'],
    sets['train_y'],
    epochs=30,
    batch_size=100,
    validation_data=(sets['test_X'], sets['test_y']),
    verbose=2,
    shuffle=False)

  # save model
  model_key = 'model-{}-{}m'.format(target, future)
  model_path = 'frozen/{}'.format(model_key)
  # for use in js
  tfjs.converters.save_keras_model(model, model_path)
  # for use in golang
  tf_path = 'frozen-tf/{}'.format(model_key)
  builder = tf.saved_model.builder.SavedModelBuilder(tf_path)
  builder.add_meta_graph_and_variables(backend.get_session(),[model_key])
  builder.save()
  # model metadata
  model_params = {
    'target': target,
    'model_key': model_key,
    'input_operation': 'predictatronInput_input',
    'input_steps': in_step,
    'output_steps': out_step,
    'output_operation': 'predictatronOutput/Sigmoid',
    'predict_future_duration': future,
    'columns': []}
  column_count = int((len(data.columns) - 1) / in_step)
  for idx in range(column_count):
    parts = data.columns[idx].split(':')
    model_params['columns'].append(parts[1].split('(')[0])
  with open('{}/params.json'.format(model_path), 'w') as out:
    json.dump(model_params, out)
  with open('{}/params.json'.format(tf_path), 'w') as out:
    json.dump(model_params, out)
  
  # plot model
  if graph:
    plot(history)

if __name__ == "__main__":
  train('btc_usd', 5, False)
  train('btc_usd', 15, False)
  train('btc_usd', 60, False)
  train('eth_usd', 5, False)
  train('eth_usd', 15, False)
  train('eth_usd', 60, False)
  train('bch_usd', 5, False)
  train('bch_usd', 15, False)
  train('bch_usd', 60, False)
  