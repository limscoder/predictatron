// UGH... adapted from: https://github.com/tensorflow/tfjs-node/blob/master/src/io/file_system.ts

const fs = require("fs");
const { dirname, join, resolve } = require("path");
const util = require("util");

const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);

function doesNotExistHandler(name) {
  return e => {
    switch (e.code) {
      case "ENOENT":
        throw new Error(`${name} ${e.path} does not exist: loading failed`);
      default:
        throw e;
    }
  };
}

function toArrayBuffer(buf) {
  if (Array.isArray(buf)) {
    // An Array of Buffers.
    let totalLength = 0;
    for (const buffer of buf) {
      totalLength += buffer.length;
    }

    const ab = new ArrayBuffer(totalLength);
    const view = new Uint8Array(ab);
    let pos = 0;
    for (const buffer of buf) {
      pos += buffer.copy(view, pos);
    }
    return ab;
  } else {
    // A single Buffer. Return a copy of the underlying ArrayBuffer slice.
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

const FileSystem = function(path) {
  this.MODEL_JSON_FILENAME = "model.json";
  this.WEIGHTS_BINARY_FILENAME = "weights.bin";
  this.MODEL_BINARY_FILENAME = "tensorflowjs.pb";
  this.path = resolve(path);
};

FileSystem.URL_SCHEME = "file://";

FileSystem.prototype.load = async function() {
  const path = this.path;
  const info = await stat(path).catch(doesNotExistHandler("Path"));

  // `path` can be either a directory or a file. If it is a file, assume
  // it is model.json file.
  if (info.isFile()) {
    const modelJSON = JSON.parse(await readFile(path, "utf8"));

    const modelArtifacts = {
      modelTopology: modelJSON.modelTopology
    };
    if (modelJSON.weightsManifest != null) {
      const [weightSpecs, weightData] = await this.loadWeights(
        modelJSON.weightsManifest,
        path
      );
      modelArtifacts.weightSpecs = weightSpecs;
      modelArtifacts.weightData = weightData;
    }
    return modelArtifacts;
  } else {
    throw new Error(
      "The path to load from must be a file. Loading from a directory " +
        "is not supported."
    );
  }
};

FileSystem.prototype.loadWeights = async function(weightsManifest, path) {
  const dirName = dirname(path);
  const buffers = [];
  const weightSpecs = [];
  for (const group of weightsManifest) {
    for (const path of group.paths) {
      const weightFilePath = join(dirName, path);
      const buffer = await readFile(weightFilePath).catch(
        doesNotExistHandler("Weight file")
      );
      buffers.push(buffer);
    }
    weightSpecs.push(...group.weights);
  }
  return [weightSpecs, toArrayBuffer(buffers)];
};

exports.FileSystem = FileSystem;
