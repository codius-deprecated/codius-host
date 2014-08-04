var config = require('./config');
var log = require('./log');

var codiusEngine = require('codius-engine');
var EngineConfig = codiusEngine.Config;
var Compiler = codiusEngine.Compiler;
var FileManager = codiusEngine.FileManager;
var FileHash = codiusEngine.FileHash;
var Engine = codiusEngine.Engine;

// Prepare engine configuration
var engineConfig = new EngineConfig(config.get('engine'));
engineConfig.logger = log.winston;


// Boot Codius engine
var compiler = new Compiler(engineConfig);
var fileManager = new FileManager(engineConfig);
var engine = new Engine(engineConfig);

exports.engineConfig = engineConfig;
exports.compiler = compiler;
exports.fileManager = fileManager;
exports.engine = engine;
