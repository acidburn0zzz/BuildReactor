require.config({
	baseUrl: '..',
	paths: {
		jquery: 'lib/jquery/jquery',
		amdUtils: 'lib/amd-utils',
		text: 'lib/requirejs/text',
		signals: 'lib/js-signals/signals',
		xml2json: 'lib/jquery/jquery.xml2json'
	},
	deps: [
		'lib/jsContract/jsContract'
	],
	shim: {
		xml2json: [ 'jquery' ]
	}
});
require(["src/app"], function (app) {
	app.run();
});